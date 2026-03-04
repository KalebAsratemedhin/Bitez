import "dotenv/config";
import express from "express";
import morgan from "morgan";
import connectDB from "./infrastructure/config/db.js";
import { NotificationRepository } from "./infrastructure/repositories/NotificationRepository.js";
import { NotificationUseCase } from "./application/usecases/NotificationUseCase.js";
import { NotificationController } from "./infrastructure/controllers/NotificationController.js";
import { createNotificationRoutes } from "./infrastructure/web/notificationRoutes.js";
import { startNotificationRequestedConsumer } from "./infrastructure/messaging/notificationRequestedConsumer.js";

const SERVICE_NAME = "notification";

const app = express();
app.use(morgan("combined"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3005;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

async function start() {
  await connectDB();

  const notificationRepository = new NotificationRepository();
  const notificationUseCase = new NotificationUseCase({ notificationRepository });

  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  await startNotificationRequestedConsumer(rabbitUrl, notificationUseCase);

  const notificationController = new NotificationController(notificationUseCase);
  app.use("/", createNotificationRoutes(notificationController));

  app.listen(PORT, "0.0.0.0");
}

start().catch(() => process.exit(1));
