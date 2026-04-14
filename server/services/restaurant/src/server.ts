import "dotenv/config";
import express from "express";
import morgan from "morgan";
import path from "path";

import { createLogger } from "./logger.js";
import connectDB from "./infrastructure/config/db.js";
import { requestContextMiddleware, createErrorHandler, mountMetricsRoute } from "@bitez/shared";
import { RestaurantUseCase } from "./application/usecases/RestaurantUseCase.js";
import { MenuUseCase } from "./application/usecases/MenuUseCase.js";
import { RestaurantController } from "./infrastructure/controllers/RestaurantController.js";
import { MenuController } from "./infrastructure/controllers/MenuController.js";
import { RestaurantRepository } from "./infrastructure/repositories/RestaurantRepository.js";
import { MenuRepository } from "./infrastructure/repositories/MenuRepository.js";
import { RatingRepository } from "./infrastructure/repositories/RatingRepository.js";
import { DeliveredToRepository } from "./infrastructure/repositories/DeliveredToRepository.js";
import { createRestaurantRoutes } from "./infrastructure/web/restaurantRoutes.js";
import { createMenuRoutes } from "./infrastructure/web/menuRoutes.js";
import { createRatingRoutes } from "./infrastructure/web/ratingRoutes.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { startDeliveryDeliveredConsumer } from "./infrastructure/messaging/deliveryDeliveredConsumer.js";
import { CloudinaryService } from "./infrastructure/services/CloudinaryService.js";

const app = express();
app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3002;
const SERVICE_NAME = "restaurant";
const logger = createLogger({ serviceName: SERVICE_NAME });

const restaurantRepository = new RestaurantRepository();
const menuRepository = new MenuRepository();
const ratingRepository = new RatingRepository();
const deliveredToRepository = new DeliveredToRepository();
const eventPublisher = new RabbitMQEventPublisher(
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
);
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const cloudinary = new CloudinaryService({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  apiKey: process.env.CLOUDINARY_API_KEY ?? "",
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
});

const restaurantUseCase = new RestaurantUseCase({
  restaurantRepository,
  eventPublisher,
});
const menuUseCase = new MenuUseCase({ menuRepository, restaurantRepository });

const restaurantController = new RestaurantController(
  restaurantUseCase,
  ratingRepository,
  cloudinary,
  menuRepository,
);
const menuController = new MenuController(menuUseCase, cloudinary);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "restaurant" });
});
mountMetricsRoute(app);

const deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL || "http://localhost:3004";
app.use(
  "/rating",
  createRatingRoutes(restaurantController, ratingRepository, {
    deliveryServiceUrl,
    eventPublisher,
    deliveredToRepository,
  }),
);
app.use("/menu", createMenuRoutes(menuController));
app.use("/", createRestaurantRoutes(restaurantController));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(createErrorHandler(logger));

async function start() {
  await connectDB();

  const amqpShutdown = new AbortController();
  process.once("SIGTERM", () => amqpShutdown.abort());
  process.once("SIGINT", () => amqpShutdown.abort());

  if (process.env.NODE_ENV === "production") {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME?.trim() || !CLOUDINARY_API_KEY?.trim() || !CLOUDINARY_API_SECRET?.trim()) {
      logger.error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required in production");
      process.exit(1);
    }
  }
  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Restaurant service started");
  startDeliveryDeliveredConsumer(rabbitUrl, deliveredToRepository, logger, {
    signal: amqpShutdown.signal,
  }).catch((err) => logger.error({ err }, "delivery delivered consumer failed"));
}

start().catch(() => process.exit(1));
