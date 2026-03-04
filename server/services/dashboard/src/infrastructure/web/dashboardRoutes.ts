import express from "express";
import { isAuthenticated, isDeliveryPerson } from "./middlewares/auth.js";
import type { DashboardController } from "../controllers/DashboardController.js";

export function createDashboardRoutes(controller: DashboardController): express.Router {
  const router = express.Router();
  router.get("/customer", isAuthenticated, controller.getCustomerDashboard);
  router.get("/restaurant-owner", isAuthenticated, controller.getRestaurantOwnerDashboard);
  router.get("/delivery-person", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDashboard);
  return router;
}
