import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createLogger } from "./logger.js";
import connectDB from "./infrastructure/config/db.js";
import { requestContextMiddleware, createErrorHandler, mountMetricsRoute } from "@bitez/shared";
import { createDashboardReadModelsAdapter } from "./infrastructure/repositories/DashboardReadModelsAdapter.js";
import { DashboardUseCase } from "./application/usecases/DashboardUseCase.js";
import { DashboardController } from "./infrastructure/controllers/DashboardController.js";
import { createDashboardRoutes } from "./infrastructure/web/dashboardRoutes.js";
import { startDashboardEventConsumers } from "./infrastructure/messaging/dashboardEventConsumers.js";

const SERVICE_NAME = "dashboard";
const logger = createLogger({ serviceName: SERVICE_NAME });
const app = express();
app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3006;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});
mountMetricsRoute(app);

async function start() {
  await connectDB();

  const amqpShutdown = new AbortController();
  process.once("SIGTERM", () => amqpShutdown.abort());
  process.once("SIGINT", () => amqpShutdown.abort());

  const readModels = createDashboardReadModelsAdapter();
  const dashboardUseCase = new DashboardUseCase(readModels);
  const dashboardController = new DashboardController(dashboardUseCase);
  app.use("/", createDashboardRoutes(dashboardController));
  app.use(createErrorHandler(logger));

  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Dashboard service started");

  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  startDashboardEventConsumers(rabbitUrl, logger, { signal: amqpShutdown.signal }).catch((err) =>
    logger.error({ err }, "dashboard event consumers failed")
  );
}

start().catch(() => process.exit(1));
