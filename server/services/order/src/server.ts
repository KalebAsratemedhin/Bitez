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
import { OrderRepository } from "./infrastructure/repositories/OrderRepository.js";
import { OrderUseCase } from "./application/usecases/OrderUseCase.js";
import { OrderController } from "./infrastructure/controllers/OrderController.js";
import { DashboardUseCase } from "./application/usecases/DashboardUseCase.js";
import { DashboardController } from "./infrastructure/controllers/DashboardController.js";
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
import { DeliveryRepository } from "./delivery/infrastructure/repositories/DeliveryRepository.js";
import { DeliveryPersonRepository } from "./delivery/infrastructure/repositories/DeliveryPersonRepository.js";
import { UnassignedOrderRepository } from "./delivery/infrastructure/repositories/UnassignedOrderRepository.js";
import { OrderReadModelRepository } from "./delivery/infrastructure/repositories/OrderReadModelRepository.js";
import { DeliveryUseCase } from "./delivery/application/usecases/DeliveryUseCase.js";
import { DeliveryController } from "./delivery/infrastructure/controllers/DeliveryController.js";
import { createDeliveryRoutes } from "./delivery/infrastructure/web/deliveryRoutes.js";
import { startOrderEventConsumer } from "./delivery/infrastructure/messaging/orderEventConsumer.js";
import { startDeliveryPersonRatingUpdatedConsumer } from "./delivery/infrastructure/messaging/deliveryPersonRatingUpdatedConsumer.js";
import { startOrderReadyForDeliveryConsumer } from "./delivery/infrastructure/messaging/orderReadyForDeliveryConsumer.js";
import { NotificationRepository } from "./notifications/infrastructure/repositories/NotificationRepository.js";
import { NotificationUseCase } from "./notifications/application/usecases/NotificationUseCase.js";
import { NotificationController } from "./notifications/infrastructure/controllers/NotificationController.js";
import { createNotificationRoutes } from "./notifications/infrastructure/web/notificationRoutes.js";
import { startNotificationRequestedConsumer } from "./notifications/infrastructure/messaging/notificationRequestedConsumer.js";

assertProductionSecrets();
configureJwtAuth({
  getSecret: resolveJwtSecret,
  isTokenRevoked: createHttpTokenRevocationCheck(
    process.env.AUTH_SERVICE_URL || "http://auth:3001",
  ),
});

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
mountMetricsRoute(app);

async function start() {
  await connectDB();

  const amqpShutdown = new AbortController();
  process.once("SIGTERM", () => amqpShutdown.abort());
  process.once("SIGINT", () => amqpShutdown.abort());

  const orderRepository = new OrderRepository();
  const restaurantRepository = new HttpRestaurantRepository(
    process.env.RESTAURANT_SERVICE_URL || "http://restaurant:3002",
  );
  const restaurantReadModelRepository = new RestaurantReadModelRepository();
  const userReadModelRepository = new UserReadModelRepository();
  const eventPublisher = new RabbitMQEventPublisher(resolveRabbitMqUrl());
  const notificationService = new EventNotificationService(eventPublisher);
  const userRepository = new HttpUserRepository(
    process.env.AUTH_SERVICE_URL || "http://auth:3001",
  );

  const tokenService = new TokenService(resolveJwtSecret());
  const paymentGateway = new ChapaPaymentGateway(process.env.CHAPA_AUTH || "");
  const getCustomerById = async (id: string) => {
    const fromReadModel = await userReadModelRepository.findById(id);
    if (!fromReadModel) return null;
    return {
      _id: fromReadModel.userId,
      name: fromReadModel.name,
      phoneNumber: fromReadModel.phoneNumber,
    };
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

  const dashboardUseCase = new DashboardUseCase(orderRepository, restaurantReadModelRepository);
  const dashboardController = new DashboardController(dashboardUseCase);
  const orderController = new OrderController(orderUseCase);

  const deliveryRepository = new DeliveryRepository();
  const deliveryPersonRepository = new DeliveryPersonRepository();
  const unassignedOrderRepository = new UnassignedOrderRepository();
  const orderReadModelRepository = new OrderReadModelRepository();
  const getUserById = async (userId: string) => {
    const fromReadModel = await userReadModelRepository.findById(userId);
    if (!fromReadModel) return null;
    return {
      _id: fromReadModel.userId,
      name: fromReadModel.name,
      phoneNumber: fromReadModel.phoneNumber,
    };
  };
  const deliveryUseCase = new DeliveryUseCase({
    deliveryRepository,
    deliveryPersonRepository,
    unassignedOrderRepository,
    orderReadModelRepository,
    notificationService,
    eventPublisher,
    getUserById,
  });
  const deliveryController = new DeliveryController(deliveryUseCase);

  const notificationRepository = new NotificationRepository();
  const notificationUseCase = new NotificationUseCase({ notificationRepository });
  const notificationController = new NotificationController(notificationUseCase);

  app.use("/", createOrderRoutes(orderController, dashboardController));
  app.use("/delivery", createDeliveryRoutes(deliveryController));
  app.use("/notifications", createNotificationRoutes(notificationController));
  app.use(createErrorHandler(logger));

  app.listen(PORT, "0.0.0.0");
  logger.info({ port: PORT }, "Order service started (includes delivery + notifications)");

  const rabbitUrl = resolveRabbitMqUrl();
  const amqpOpts = { signal: amqpShutdown.signal };
  startRestaurantEventConsumer(rabbitUrl, restaurantReadModelRepository, logger, amqpOpts).catch((err) =>
    logger.error({ err }, "restaurant event consumer failed"),
  );
  startUserRegisteredConsumer(rabbitUrl, userReadModelRepository, logger, {
    ...amqpOpts,
    deliveryUseCase,
  }).catch((err) => logger.error({ err }, "user registered consumer failed"));
  startDeliveryCreatedConsumer(rabbitUrl, orderRepository, notificationService, logger, amqpOpts).catch(
    (err) => logger.error({ err }, "delivery created consumer failed"),
  );
  startOrderEventConsumer(rabbitUrl, orderReadModelRepository, logger, amqpOpts).catch((err) =>
    logger.error({ err }, "order event consumer (delivery read model) failed"),
  );
  startDeliveryPersonRatingUpdatedConsumer(rabbitUrl, deliveryPersonRepository, logger, amqpOpts).catch(
    (err) => logger.error({ err }, "delivery person rating consumer failed"),
  );
  startOrderReadyForDeliveryConsumer(rabbitUrl, deliveryUseCase, logger, amqpOpts).catch((err) =>
    logger.error({ err }, "order ready for delivery consumer failed"),
  );
  startNotificationRequestedConsumer(rabbitUrl, notificationUseCase, logger, amqpOpts).catch((err) =>
    logger.error({ err }, "notification requested consumer failed"),
  );
}

start().catch(() => process.exit(1));
