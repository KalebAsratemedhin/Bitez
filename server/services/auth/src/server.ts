import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createLogger } from "./logger.js";
import connectDB from "./infrastructure/config/db.js";
import { requestContextMiddleware, createErrorHandler, mountMetricsRoute } from "@bitez/shared";
import { AuthUseCase } from "./application/usecases/AuthUseCase.js";
import { AuthController } from "./infrastructure/controllers/AuthController.js";
import { UserRepository } from "./infrastructure/repositories/UserRepository.js";
import { BlacklistedTokenRepository } from "./infrastructure/repositories/BlacklistedTokenRepository.js";
import { HttpDeliveryPersonRepository } from "./infrastructure/repositories/HttpDeliveryPersonRepository.js";
import { TokenService } from "./infrastructure/services/TokenService.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { createAuthRoutes } from "./infrastructure/web/authRoutes.js";

const SERVICE_NAME = "auth";
const logger = createLogger({ serviceName: SERVICE_NAME });
const app = express();

app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3001;

const userRepository = new UserRepository();
const blacklistedTokenRepository = new BlacklistedTokenRepository();
const deliveryPersonRepository = new HttpDeliveryPersonRepository(
  process.env.DELIVERY_SERVICE_URL || "http://delivery:3004",
);
const tokenService = new TokenService(process.env.JWT_SECRET || "dev-secret");
const eventPublisher = new RabbitMQEventPublisher(
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
);

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

start().catch(() => process.exit(1));
