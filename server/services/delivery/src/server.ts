import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createLogger } from "./logger.js";
import connectDB from "./infrastructure/config/db.js";
import { DeliveryRepository } from "./infrastructure/repositories/DeliveryRepository.js";
import { DeliveryPersonRepository } from "./infrastructure/repositories/DeliveryPersonRepository.js";
import { DeliveryUseCase } from "./application/usecases/DeliveryUseCase.js";
import { DeliveryController } from "./infrastructure/controllers/DeliveryController.js";
import { createDeliveryRoutes } from "./infrastructure/web/deliveryRoutes.js";
import { EventNotificationService } from "./infrastructure/services/EventNotificationService.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { startUserRegisteredConsumer } from "./infrastructure/messaging/userRegisteredConsumer.js";
import { startDeliveryPersonRatingUpdatedConsumer } from "./infrastructure/messaging/deliveryPersonRatingUpdatedConsumer.js";
import { startOrderReadyForDeliveryConsumer } from "./infrastructure/messaging/orderReadyForDeliveryConsumer.js";
import { startOrderEventConsumer } from "./infrastructure/messaging/orderEventConsumer.js";
import { UnassignedOrderRepository } from "./infrastructure/repositories/UnassignedOrderRepository.js";
import { OrderReadModelRepository } from "./infrastructure/repositories/OrderReadModelRepository.js";
import { UserReadModelRepository } from "./infrastructure/repositories/UserReadModelRepository.js";
const SERVICE_NAME = "delivery";
const logger = createLogger({ serviceName: SERVICE_NAME });

const app = express();
app.use(morgan("combined"));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3004;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

async function start() {
  await connectDB();

  const deliveryRepository = new DeliveryRepository();
  const deliveryPersonRepository = new DeliveryPersonRepository();
  const unassignedOrderRepository = new UnassignedOrderRepository();
  const orderReadModelRepository = new OrderReadModelRepository();
  const userReadModelRepository = new UserReadModelRepository();
  const eventPublisher = new RabbitMQEventPublisher(
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  );
  
  const notificationService = new EventNotificationService(eventPublisher);
  const orderBase = (process.env.ORDER_SERVICE_URL || "http://order:3003").replace(/\/$/, "");
  const authBase = (process.env.AUTH_SERVICE_URL || "http://auth:3001").replace(/\/$/, "");
  
  const getOrderByIdEnriched = async (orderId: string) => {
    try {
      const res = await fetch(`${orderBase}/internal/order/${encodeURIComponent(orderId)}`);
      if (!res.ok) return null;

      return (await res.json()) as unknown;
    } catch {
      return null;
    }
  };
  const getUserById = async (userId: string) => {
    const fromReadModel = await userReadModelRepository.findById(userId);
    if (fromReadModel) {
      return {
        _id: fromReadModel.userId,
        name: fromReadModel.name,
        phoneNumber: fromReadModel.phoneNumber,
      };
    }
    try {
      const res = await fetch(`${authBase}/internal/user/${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      return (await res.json()) as { _id: string; name: string; phoneNumber?: string };
    } catch {
      return null;
    }
  };

  const deliveryUseCase = new DeliveryUseCase({
    deliveryRepository,
    deliveryPersonRepository,
    unassignedOrderRepository,
    orderReadModelRepository,
    notificationService,
    eventPublisher,
    getOrderByIdEnriched,
    getUserById,
  });

  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  await startOrderEventConsumer(rabbitUrl, orderReadModelRepository, logger);
  await startUserRegisteredConsumer(rabbitUrl, deliveryUseCase, userReadModelRepository, logger);
  await startDeliveryPersonRatingUpdatedConsumer(rabbitUrl, deliveryPersonRepository);
  await startOrderReadyForDeliveryConsumer(rabbitUrl, deliveryUseCase, logger);

  const deliveryController = new DeliveryController(deliveryUseCase);
  const deliveryRoutes = createDeliveryRoutes(deliveryController);

  app.use("/delivery", deliveryRoutes);
  app.use("/", deliveryRoutes);

  app.listen(PORT, "0.0.0.0");
}

start().catch(() => process.exit(1));
