import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createLogger } from "./logger.js";
import connectDB from "./infrastructure/config/db.js";
import { requestContextMiddleware } from "./infrastructure/http/requestContext.js";
import { createErrorHandler } from "./infrastructure/http/errorHandler.js";
import { OrderRepository } from "./infrastructure/repositories/OrderRepository.js";
import { OrderUseCase } from "./application/usecases/OrderUseCase.js";
import { OrderController } from "./infrastructure/controllers/OrderController.js";
import { createOrderRoutes } from "./infrastructure/web/orderRoutes.js";
import { HttpRestaurantRepository } from "./infrastructure/services/HttpRestaurantRepository.js";
import { EventNotificationService } from "./infrastructure/services/EventNotificationService.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { HttpUserRepository } from "./infrastructure/services/HttpUserRepository.js";
import { TokenService } from "./infrastructure/services/TokenService.js";
import { ChapaPaymentGateway } from "./infrastructure/services/ChapaPaymentGateway.js";
import { startDeliveryCreatedConsumer } from "./infrastructure/messaging/deliveryCreatedConsumer.js";
import { startRestaurantEventConsumer } from "./infrastructure/messaging/restaurantEventConsumer.js";
import { startUserRegisteredConsumer } from "./infrastructure/messaging/userRegisteredConsumer.js";
import { RestaurantReadModelRepository } from "./infrastructure/repositories/RestaurantReadModelRepository.js";
import { UserReadModelRepository } from "./infrastructure/repositories/UserReadModelRepository.js";

const SERVICE_NAME = "order";
const logger = createLogger({ serviceName: SERVICE_NAME });

const app = express();
app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3003;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

async function start() {
  await connectDB();

  const orderRepository = new OrderRepository();
  const restaurantRepository = new HttpRestaurantRepository(
    process.env.RESTAURANT_SERVICE_URL || "http://restaurant:3002",
  );
  const restaurantReadModelRepository = new RestaurantReadModelRepository();
  const userReadModelRepository = new UserReadModelRepository();
  const eventPublisher = new RabbitMQEventPublisher(
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  );
  const notificationService = new EventNotificationService(eventPublisher);
  const userRepository = new HttpUserRepository(
    process.env.AUTH_SERVICE_URL || "http://auth:3001",
  );

  const tokenService = new TokenService(process.env.JWT_SECRET || "dev-secret");
  const paymentGateway = new ChapaPaymentGateway(process.env.CHAPA_AUTH || "");
  const authBase = (process.env.AUTH_SERVICE_URL || "http://auth:3001").replace(/\/$/, "");
  const getCustomerById = async (id: string) => {
    const fromReadModel = await userReadModelRepository.findById(id);
    if (fromReadModel) {
      return { _id: fromReadModel.userId, name: fromReadModel.name, phoneNumber: fromReadModel.phoneNumber };
    }
    try {
      const token = process.env.INTERNAL_SERVICE_TOKEN?.trim();
      const headers: Record<string, string> = {};
      if (token) headers["X-Internal-Token"] = token;
      const res = await fetch(`${authBase}/internal/user/${encodeURIComponent(id)}`, { headers });
      if (!res.ok) return null;
      return (await res.json()) as { _id: string; name: string; phoneNumber?: string };
    } catch {
      return null;
    }
  };

  const orderUseCase = new OrderUseCase({
    orderRepository,
    restaurantRepository,
    restaurantReadModelRepository,
    notificationService,
    userRepository,
    paymentGateway,
    tokenService,
    eventPublisher,
    getCustomerById,
  });

  const orderController = new OrderController(orderUseCase);
  app.use("/", createOrderRoutes(orderController));
  app.use(createErrorHandler(logger));

  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Order service started");

  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  startRestaurantEventConsumer(rabbitUrl, restaurantReadModelRepository, logger).catch((err) =>
    logger.error({ err }, "restaurant event consumer failed")
  );
  startUserRegisteredConsumer(rabbitUrl, userReadModelRepository, logger).catch((err) =>
    logger.error({ err }, "user registered consumer failed")
  );
  startDeliveryCreatedConsumer(rabbitUrl, orderRepository, notificationService, logger).catch((err) =>
    logger.error({ err }, "delivery created consumer failed")
  );
}

start().catch(() => process.exit(1));
