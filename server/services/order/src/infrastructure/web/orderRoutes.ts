import express from "express";
import { isAuthenticated, isAdmin, isRestaurantOwner } from "@bitez/shared";
import { requireInternalServiceToken } from "@bitez/shared";
import type { OrderController } from "../controllers/OrderController.js";
import type { DashboardController } from "../controllers/DashboardController.js";

export function createOrderRoutes(
  controller: OrderController,
  dashboardController: DashboardController,
): express.Router {
  const router = express.Router();
  router.get("/dashboard/customer", isAuthenticated, dashboardController.getCustomerDashboard);
  router.put("/status/:id", isAuthenticated, isRestaurantOwner, controller.updateOrderStatus);
  router.get("/payment-success", controller.paymentSuccess);
  router.put("/cancel/:id", isAuthenticated, controller.cancelOrder);
  router.get("/customer", isAuthenticated, controller.getCustomerOrders);
  router.get("/restaurant/:id", isAuthenticated, controller.getRestaurantOrders);
  router.get("/internal/order/:id", requireInternalServiceToken, controller.getInternalOrderById);
  router.get("/:id", isAuthenticated, controller.getOrderById);
  router.post("/pay", isAuthenticated, controller.payForOrder);
  router.post("/", isAuthenticated, controller.createOrder);
  router.get("/", isAuthenticated, isAdmin, controller.getAllOrders);
  return router;
}
