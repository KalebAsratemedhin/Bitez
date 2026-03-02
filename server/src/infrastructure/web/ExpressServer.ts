import express from "express";
import cors from "cors";
import path from "path";

import { AuthUseCase } from "@application/usecases/AuthUseCase.js";
import { OrderUseCase } from "@application/usecases/OrderUseCase.js";
import { DeliveryUseCase } from "@application/usecases/DeliveryUseCase.js";
import { RestaurantUseCase } from "@application/usecases/RestaurantUseCase.js";
import { MenuUseCase } from "@application/usecases/MenuUseCase.js";
import { DashboardUseCase } from "@application/usecases/DashboardUseCase.js";
import { NotificationUseCase } from "@application/usecases/NotificationUseCase.js";

import { AuthController } from "@infrastructure/controllers/AuthController.js";
import { OrderController } from "@infrastructure/controllers/OrderController.js";
import { DeliveryController } from "@infrastructure/controllers/DeliveryController.js";
import { RestaurantController } from "@infrastructure/controllers/RestaurantController.js";
import { MenuController } from "@infrastructure/controllers/MenuController.js";
import { DashboardController } from "@infrastructure/controllers/DashboardController.js";
import { NotificationController } from "@infrastructure/controllers/NotificationController.js";

import { OrderRepository } from "@infrastructure/repositories/OrderRepository.js";
import { UserRepository } from "@infrastructure/repositories/UserRepository.js";
import { RestaurantRepository } from "@infrastructure/repositories/RestaurantRepository.js";
import { DeliveryRepository } from "@infrastructure/repositories/DeliveryRepository.js";
import { DeliveryPersonRepository } from "@infrastructure/repositories/DeliveryPersonRepository.js";
import { BlacklistedTokenRepository } from "@infrastructure/repositories/BlacklistedTokenRepository.js";
import { MenuRepository } from "@infrastructure/repositories/MenuRepository.js";
import { NotificationRepository } from "@infrastructure/repositories/NotificationRepository.js";
import { RatingRepository } from "@infrastructure/repositories/RatingRepository.js";

import { TokenService } from "@infrastructure/services/TokenService.js";
import { ChapaPaymentGateway } from "@infrastructure/services/ChapaPaymentGateway.js";
import { SocketNotificationService } from "@infrastructure/services/SocketNotificationService.js";

import { createAuthRoutes } from "@infrastructure/web/authRoutes.js";
import { createOrderRoutes } from "@infrastructure/web/orderRoutes.js";
import { createDeliveryRoutes } from "@infrastructure/web/deliveryRoutes.js";
import { createRestaurantRoutes } from "@infrastructure/web/restaurantRoutes.js";
import { createMenuRoutes } from "@infrastructure/web/menuRoutes.js";
import { createDashboardRoutes } from "@infrastructure/web/dashboardRoutes.js";
import { createNotificationRoutes } from "@infrastructure/web/notificationRoutes.js";
import { createRatingRoutes } from "@infrastructure/web/ratingRoutes.js";

type IoInstance = { to: (room: string) => { emit: (event: string, payload: unknown) => void } } | null;

export function createApp(): {
  app: express.Express;
  setIo: (io: unknown) => void;
} {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: "*", credentials: true }));

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  const ioRef: { current: unknown } = { current: null };
  const getIo = (): IoInstance => ioRef.current as IoInstance;

  const orderRepository = new OrderRepository();
  const userRepository = new UserRepository();
  const restaurantRepository = new RestaurantRepository();
  const deliveryRepository = new DeliveryRepository();
  const deliveryPersonRepository = new DeliveryPersonRepository();
  const blacklistedTokenRepository = new BlacklistedTokenRepository();
  const menuRepository = new MenuRepository();
  const notificationRepository = new NotificationRepository();
  const ratingRepository = new RatingRepository();

  const notificationService = new SocketNotificationService(getIo);
  const tokenService = new TokenService(process.env.JWT_SECRET || "dev-secret");
  const paymentGateway = new ChapaPaymentGateway(process.env.CHAPA_AUTH!);

  const authUseCase = new AuthUseCase({
    userRepository,
    deliveryPersonRepository,
    tokenService,
    blacklistedTokenRepository,
  });

  const orderUseCase = new OrderUseCase({
    orderRepository,
    restaurantRepository,
    notificationService,
    deliveryPersonRepository,
    deliveryRepository,
    userRepository,
    paymentGateway,
    tokenService,
  });

  const deliveryUseCase = new DeliveryUseCase({
    deliveryRepository,
    deliveryPersonRepository,
    notificationService,
  });

  const restaurantUseCase = new RestaurantUseCase({ restaurantRepository });
  const menuUseCase = new MenuUseCase({ menuRepository, restaurantRepository });
  const dashboardUseCase = new DashboardUseCase({
    orderRepository,
    restaurantRepository,
  });
  const notificationUseCase = new NotificationUseCase({ notificationRepository });

  const authController = new AuthController(authUseCase);
  const orderController = new OrderController(orderUseCase);
  const deliveryController = new DeliveryController(deliveryUseCase);
  const restaurantController = new RestaurantController(restaurantUseCase, ratingRepository);
  const menuController = new MenuController(menuUseCase);
  const dashboardController = new DashboardController(dashboardUseCase, deliveryUseCase);
  const notificationController = new NotificationController(notificationUseCase);

  app.use("/auth", createAuthRoutes(authController));
  app.use("/order", createOrderRoutes(orderController));
  app.use("/delivery", createDeliveryRoutes(deliveryController));
  app.use("/notification", createNotificationRoutes(notificationController));
  app.use("/dashboard", createDashboardRoutes(dashboardController));
  app.use("/rating", createRatingRoutes(restaurantController, ratingRepository, deliveryRepository));
  app.use("/restaurant", createRestaurantRoutes(restaurantController));
  app.use("/menu", createMenuRoutes(menuController));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  return {
    app,
    setIo(io: unknown) {
      ioRef.current = io;
    },
  };
}
