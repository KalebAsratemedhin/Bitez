import "dotenv/config";
import {
  createLogger,
  requestContextMiddleware,
  createErrorHandler,
  mountMetricsRoute,
  configureJwtAuth,
  createHttpTokenRevocationCheck,
  assertProductionSecrets,
  resolveJwtSecret,
  resolveRabbitMqUrl,
} from "@bitez/shared";
import express from "express";
import morgan from "morgan";
import connectDB from "./infrastructure/config/db.js";
import { NotificationRepository } from "./infrastructure/repositories/NotificationRepository.js";
import { NotificationUseCase } from "./application/usecases/NotificationUseCase.js";
import { NotificationController } from "./infrastructure/controllers/NotificationController.js";
import { createNotificationRoutes } from "./infrastructure/web/notificationRoutes.js";
import { startNotificationRequestedConsumer } from "./infrastructure/messaging/notificationRequestedConsumer.js";


assertProductionSecrets();
configureJwtAuth({
  getSecret: resolveJwtSecret,
  isTokenRevoked: createHttpTokenRevocationCheck(
    process.env.AUTH_SERVICE_URL || "http://auth:3001",
  ),
});

const SERVICE_NAME = "notification";
const logger = createLogger({ serviceName: SERVICE_NAME });
const app = express();
app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3005;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});
mountMetricsRoute(app);

async function start() {
  await connectDB();

  const amqpShutdown = new AbortController();
  process.once("SIGTERM", () => amqpShutdown.abort());
  process.once("SIGINT", () => amqpShutdown.abort());

  const notificationRepository = new NotificationRepository();
  const notificationUseCase = new NotificationUseCase({ notificationRepository });
  const notificationController = new NotificationController(notificationUseCase);
  app.use("/", createNotificationRoutes(notificationController));
  app.use(createErrorHandler(logger));

  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Notification service started");

  const rabbitUrl = resolveRabbitMqUrl();
  startNotificationRequestedConsumer(rabbitUrl, notificationUseCase, logger, {
    signal: amqpShutdown.signal,
  }).catch((err) => logger.error({ err }, "notification requested consumer failed"));
}

start().catch(() => process.exit(1));
