import express from "express";
import { isAuthenticated, isAdmin, isDeliveryPerson } from "./middlewares/auth.js";
import { requireInternalServiceToken } from "@bitez/shared";
import type { DeliveryController } from "../controllers/DeliveryController.js";

export function createDeliveryRoutes(controller: DeliveryController): express.Router {
  const router = express.Router();
  router.post("/delivery-person", requireInternalServiceToken, controller.createDeliveryPerson);
  router.put("/status/:id", isAuthenticated, isDeliveryPerson, controller.updateDeliveryStatus);
  router.get("/delivery-person/deliveries", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDeliveries);
  router.get("/delivery-person/dashboard", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDashboard);
  router.get(
    "/delivery-person/:id/delivered-to/:userId",
    requireInternalServiceToken,
    controller.hasDeliveredToUser,
  );
  router.get(
    "/delivery-person/by-user/:userId",
    requireInternalServiceToken,
    controller.getDeliveryPersonByUserId,
  );
  router.get("/customer", isAuthenticated, controller.getCustomerDeliveries);
  router.get("/all", isAuthenticated, isAdmin, controller.getAllDeliveries);
  return router;
}
