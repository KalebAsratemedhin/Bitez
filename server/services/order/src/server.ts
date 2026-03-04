import "dotenv/config";
import express from "express";
import morgan from "morgan";
import connectDB from "./infrastructure/config/db.js";
import { OrderRepository } from "./infrastructure/repositories/OrderRepository.js";
import { OrderUseCase } from "./application/usecases/OrderUseCase.js";
import { OrderController } from "./infrastructure/controllers/OrderController.js";
import { createOrderRoutes } from "./infrastructure/web/orderRoutes.js";
import { HttpRestaurantRepository } from "./infrastructure/services/HttpRestaurantRepository.js";
import { EventNotificationService } from "./infrastructure/services/EventNotificationService.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { HttpUserRepository } from "./infrastructure/services/HttpUserRepository.js";
import { HttpDeliveryAssignmentService } from "./infrastructure/services/HttpDeliveryAssignmentService.js";
import { TokenService } from "./infrastructure/services/TokenService.js";
import { ChapaPaymentGateway } from "./infrastructure/services/ChapaPaymentGateway.js";

const SERVICE_NAME = "order";

const app = express();
app.use(morgan("combined"));
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
  const eventPublisher = new RabbitMQEventPublisher(
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  );
  const notificationService = new EventNotificationService(eventPublisher);
  const userRepository = new HttpUserRepository(
    process.env.AUTH_SERVICE_URL || "http://auth:3001",
  );
  const deliveryAssignmentService = new HttpDeliveryAssignmentService(
    process.env.DELIVERY_SERVICE_URL || "http://delivery:3004",
  );
  const tokenService = new TokenService(process.env.JWT_SECRET || "dev-secret");
  const paymentGateway = new ChapaPaymentGateway(process.env.CHAPA_AUTH || "");
  const authBase = (process.env.AUTH_SERVICE_URL || "http://auth:3001").replace(/\/$/, "");
  const getCustomerById = async (id: string) => {
    try {
      const res = await fetch(`${authBase}/internal/user/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return (await res.json()) as { _id: string; name: string; phoneNumber?: string };
    } catch {
      return null;
    }
  };

  const orderUseCase = new OrderUseCase({
    orderRepository,
    restaurantRepository,
    notificationService,
    deliveryAssignmentService,
    userRepository,
    paymentGateway,
    tokenService,
    eventPublisher,
    getCustomerById,
  });

  const orderController = new OrderController(orderUseCase);
  app.use("/", createOrderRoutes(orderController));

  app.listen(PORT, "0.0.0.0");
}

start().catch(() => process.exit(1));
