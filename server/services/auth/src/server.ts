import "dotenv/config";
import {
  createLogger,
  assertProductionSecrets,
  resolveRabbitMqUrl,
} from "@bitez/shared";
import connectDB from "./infrastructure/config/db.js";
import { createAuthApp } from "./createApp.js";
import { startAuthDeliveryPersonEventConsumers } from "./infrastructure/messaging/deliveryPersonEventConsumers.js";

assertProductionSecrets();

const SERVICE_NAME = "auth";
const logger = createLogger({ serviceName: SERVICE_NAME });
const PORT = Number(process.env.PORT) || 3001;
const { app, deliveryPersonReadModel } = createAuthApp(logger);

async function start() {
  await connectDB();

  const amqpShutdown = new AbortController();
  process.once("SIGTERM", () => amqpShutdown.abort());
  process.once("SIGINT", () => amqpShutdown.abort());

  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Auth service started");

  startAuthDeliveryPersonEventConsumers(
    resolveRabbitMqUrl(),
    deliveryPersonReadModel,
    logger,
    { signal: amqpShutdown.signal },
  ).catch((err) => logger.error({ err }, "auth delivery-person consumers failed"));
}

start().catch((err) => {
  logger.error({ err }, "Auth service failed to start");
  process.exit(1);
});
