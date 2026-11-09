import "dotenv/config";
import express from "express";
import morgan from "morgan";
import {
  requestContextMiddleware,
  createErrorHandler,
  mountMetricsRoute,
  createLogger,
  configureJwtAuth,
  assertProductionSecrets,
  resolveJwtSecret,
  resolveRabbitMqUrl,
} from "@bitez/shared";
import connectDB from "./infrastructure/config/db.js";
import { AuthUseCase } from "./application/usecases/AuthUseCase.js";
import { AuthController } from "./infrastructure/controllers/AuthController.js";
import { UserRepository } from "./infrastructure/repositories/UserRepository.js";
import { BlacklistedTokenRepository } from "./infrastructure/repositories/BlacklistedTokenRepository.js";
import { HttpDeliveryPersonRepository } from "./infrastructure/repositories/HttpDeliveryPersonRepository.js";
import { TokenService } from "./infrastructure/services/TokenService.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { createAuthRoutes } from "./infrastructure/web/authRoutes.js";

assertProductionSecrets();

const SERVICE_NAME = "auth";
const logger = createLogger({ serviceName: SERVICE_NAME });
const app = express();

const blacklistedTokenRepository = new BlacklistedTokenRepository();
configureJwtAuth({
  getSecret: resolveJwtSecret,
  isTokenRevoked: (token) => blacklistedTokenRepository.exists(token),
});

app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3001;

const userRepository = new UserRepository();
const deliveryPersonRepository = new HttpDeliveryPersonRepository(
  process.env.DELIVERY_SERVICE_URL || "http://delivery:3004",
);
const tokenService = new TokenService(resolveJwtSecret());
const eventPublisher = new RabbitMQEventPublisher(resolveRabbitMqUrl());

const authUseCase = new AuthUseCase({
  userRepository,
  deliveryPersonRepository,
  tokenService,
  blacklistedTokenRepository,
  eventPublisher,
});

const authController = new AuthController(authUseCase);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});
mountMetricsRoute(app);

app.use("/", createAuthRoutes(authController));
app.use(createErrorHandler(logger));

async function start() {
  await connectDB();
  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Auth service started");
}

start().catch((err) => {
  logger.error({ err }, "Auth service failed to start");
  process.exit(1);
});
