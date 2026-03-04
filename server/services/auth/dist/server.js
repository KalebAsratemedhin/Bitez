import "dotenv/config";
import express from "express";
import morgan from "morgan";
import connectDB from "./infrastructure/config/db.js";
import { AuthUseCase } from "./application/usecases/AuthUseCase.js";
import { AuthController } from "./infrastructure/controllers/AuthController.js";
import { UserRepository } from "./infrastructure/repositories/UserRepository.js";
import { BlacklistedTokenRepository } from "./infrastructure/repositories/BlacklistedTokenRepository.js";
import { HttpDeliveryPersonRepository } from "./infrastructure/repositories/HttpDeliveryPersonRepository.js";
import { TokenService } from "./infrastructure/services/TokenService.js";
import { RabbitMQEventPublisher } from "./infrastructure/messaging/RabbitMQEventPublisher.js";
import { createAuthRoutes } from "./infrastructure/web/authRoutes.js";
const app = express();
app.use(morgan("combined"));
app.use(express.json());
const PORT = Number(process.env.PORT) || 3001;
const userRepository = new UserRepository();
const blacklistedTokenRepository = new BlacklistedTokenRepository();
const deliveryPersonRepository = new HttpDeliveryPersonRepository(process.env.DELIVERY_SERVICE_URL || "http://delivery:3004");
const tokenService = new TokenService(process.env.JWT_SECRET || "dev-secret");
const eventPublisher = new RabbitMQEventPublisher(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");
const authUseCase = new AuthUseCase({
    userRepository,
    deliveryPersonRepository,
    tokenService,
    blacklistedTokenRepository,
    eventPublisher,
});
const authController = new AuthController(authUseCase);
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth" });
});
app.use("/", createAuthRoutes(authController));
async function start() {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Auth service on port ${PORT}`);
    });
}
start().catch((err) => {
    console.error(err);
    process.exit(1);
});
