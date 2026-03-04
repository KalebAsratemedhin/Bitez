import "dotenv/config";
import express from "express";
import morgan from "morgan";
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
const SERVICE_NAME = "delivery";
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
    const eventPublisher = new RabbitMQEventPublisher(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");
    const notificationService = new EventNotificationService(eventPublisher);
    const orderBase = (process.env.ORDER_SERVICE_URL || "http://order:3003").replace(/\/$/, "");
    const authBase = (process.env.AUTH_SERVICE_URL || "http://auth:3001").replace(/\/$/, "");
    const getOrderByIdEnriched = async (orderId) => {
        try {
            const res = await fetch(`${orderBase}/internal/order/${encodeURIComponent(orderId)}`);
            if (!res.ok)
                return null;
            return (await res.json());
        }
        catch {
            return null;
        }
    };
    const getUserById = async (userId) => {
        try {
            const res = await fetch(`${authBase}/internal/user/${encodeURIComponent(userId)}`);
            if (!res.ok)
                return null;
            return (await res.json());
        }
        catch {
            return null;
        }
    };
    const deliveryUseCase = new DeliveryUseCase({
        deliveryRepository,
        deliveryPersonRepository,
        notificationService,
        eventPublisher,
        getOrderByIdEnriched,
        getUserById,
    });
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    await startUserRegisteredConsumer(rabbitUrl, deliveryUseCase);
    await startDeliveryPersonRatingUpdatedConsumer(rabbitUrl, deliveryPersonRepository);
    console.log(`${SERVICE_NAME}: consuming user.registered, delivery_person.rating.updated`);
    const deliveryController = new DeliveryController(deliveryUseCase);
    const deliveryRoutes = createDeliveryRoutes(deliveryController);
    app.use("/delivery", deliveryRoutes); // gateway forwards full path /delivery/...
    app.use("/", deliveryRoutes); // internal callers (auth, order) use /delivery-person/...
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`${SERVICE_NAME} service on port ${PORT}`);
    });
}
start().catch((err) => {
    console.error(err);
    process.exit(1);
});
