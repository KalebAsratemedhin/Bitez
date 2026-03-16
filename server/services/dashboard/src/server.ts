import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createLogger } from "./logger.js";
import connectDB from "./infrastructure/config/db.js";
import { createDashboardReadModelsAdapter } from "./infrastructure/repositories/DashboardReadModelsAdapter.js";
import { DashboardUseCase } from "./application/usecases/DashboardUseCase.js";
import { DashboardController } from "./infrastructure/controllers/DashboardController.js";
import { createDashboardRoutes } from "./infrastructure/web/dashboardRoutes.js";
import { startDashboardEventConsumers } from "./infrastructure/messaging/dashboardEventConsumers.js";

const SERVICE_NAME = "dashboard";
const logger = createLogger({ serviceName: SERVICE_NAME });
const app = express();
app.use(morgan("combined"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3006;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

async function start() {
  await connectDB();

  const readModels = createDashboardReadModelsAdapter();
  const dashboardUseCase = new DashboardUseCase(readModels);
  const dashboardController = new DashboardController(dashboardUseCase);

  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  await startDashboardEventConsumers(rabbitUrl, logger);

  app.use("/", createDashboardRoutes(dashboardController));

  app.listen(PORT, "0.0.0.0");
}

start().catch(() => process.exit(1));
