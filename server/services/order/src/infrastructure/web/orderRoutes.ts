import express from "express";
import { isAuthenticated, isAdmin, isRestaurantOwner } from "./middlewares/auth.js";
import { requireInternalServiceToken } from "./middlewares/internalAuth.js";
import type { OrderController } from "../controllers/OrderController.js";

export function createOrderRoutes(controller: OrderController): express.Router {
  const router = express.Router();
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
