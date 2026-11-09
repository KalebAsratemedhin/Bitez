import express from "express";
import morgan from "morgan";
import {
  requestContextMiddleware,
  createErrorHandler,
  mountMetricsRoute,
  configureJwtAuth,
  resolveJwtSecret,
  type Logger,
} from "@bitez/shared";
import { AuthUseCase } from "./application/usecases/AuthUseCase.js";
import { AuthController } from "./infrastructure/controllers/AuthController.js";
import { UserRepository } from "./infrastructure/repositories/UserRepository.js";
import { BlacklistedTokenRepository } from "./infrastructure/repositories/BlacklistedTokenRepository.js";
import { DeliveryPersonRatingReadModelRepository } from "./infrastructure/repositories/DeliveryPersonRatingReadModelRepository.js";
import { TokenService } from "./infrastructure/services/TokenService.js";
import { createAuthRoutes } from "./infrastructure/web/authRoutes.js";
import type { IDeliveryPersonRepository } from "./domain/interfaces/DeliveryPersonRepository.js";

export interface AuthApp {
  app: express.Application;
  deliveryPersonReadModel: IDeliveryPersonRepository;
}

export function createAuthApp(logger: Logger): AuthApp {
  const app = express();

  const blacklistedTokenRepository = new BlacklistedTokenRepository();
  configureJwtAuth({
    getSecret: resolveJwtSecret,
    isTokenRevoked: (token) => blacklistedTokenRepository.exists(token),
  });

  app.use(requestContextMiddleware);
  morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
  app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));
  app.use(express.json());

  const userRepository = new UserRepository();
  const deliveryPersonReadModel = new DeliveryPersonRatingReadModelRepository();
  const tokenService = new TokenService(resolveJwtSecret());

  const authUseCase = new AuthUseCase({
    userRepository,
    deliveryPersonRepository: deliveryPersonReadModel,
    tokenService,
    blacklistedTokenRepository,
  });

  const authController = new AuthController(authUseCase);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth" });
  });
  mountMetricsRoute(app);
  app.use("/", createAuthRoutes(authController));
  app.use(createErrorHandler(logger));

  return { app, deliveryPersonReadModel };
}
