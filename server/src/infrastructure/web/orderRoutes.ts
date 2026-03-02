import express from "express";

import { isAuthenticated, isRestaurantOwner } from "@middlewares/auth.js";
import type { OrderController } from "@infrastructure/controllers/OrderController.js";

export function createOrderRoutes(controller: OrderController): express.Router {
  const router = express.Router();
  router.put("/status/:id", isAuthenticated, isRestaurantOwner, controller.updateOrderStatus);
  router.get("/payment-success", controller.paymentSuccess);
  router.put("/cancel/:id", isAuthenticated, controller.cancelOrder);
  router.get("/customer", isAuthenticated, controller.getCustomerOrders);
  router.get("/restaurant/:id", isAuthenticated, controller.getRestaurantOrders);
  router.get("/:id", isAuthenticated, controller.getOrderById);
  router.post("/pay", isAuthenticated, controller.payForOrder);
  router.post("/", isAuthenticated, controller.createOrder);
  router.get("/", isAuthenticated, controller.getAllOrders);
  return router;
}
