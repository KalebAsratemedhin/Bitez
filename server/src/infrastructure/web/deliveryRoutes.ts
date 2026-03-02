import express from "express";

import { isAuthenticated, isAdmin, isDeliveryPerson } from "@middlewares/auth.js";
import type { DeliveryController } from "@infrastructure/controllers/DeliveryController.js";

export function createDeliveryRoutes(controller: DeliveryController): express.Router {
  const router = express.Router();
  router.put("/status/:id", isAuthenticated, isDeliveryPerson, controller.updateDeliveryStatus);
  router.get("/delivery-person", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDeliveries);
  router.get("/customer", isAuthenticated, controller.getCustomerDeliveries);
  router.get("/all", isAuthenticated, isAdmin, controller.getAllDeliveries);
  return router;
}
