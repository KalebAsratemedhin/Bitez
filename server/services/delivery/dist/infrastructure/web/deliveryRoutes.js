import express from "express";
import { isAuthenticated, isAdmin, isDeliveryPerson } from "./middlewares/auth.js";
export function createDeliveryRoutes(controller) {
    const router = express.Router();
    router.post("/delivery-person", controller.createDeliveryPerson);
    router.post("/assign", controller.assignDelivery);
    router.put("/status/:id", isAuthenticated, isDeliveryPerson, controller.updateDeliveryStatus);
    // List deliveries: use /delivery-person/deliveries so it never matches /delivery-person/:id/...
    router.get("/delivery-person/deliveries", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDeliveries);
    router.get("/delivery-person/dashboard", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDashboard);
    router.get("/delivery-person/:id/delivered-to/:userId", controller.hasDeliveredToUser);
    router.get("/delivery-person/by-user/:userId", controller.getDeliveryPersonByUserId);
    router.get("/customer", isAuthenticated, controller.getCustomerDeliveries);
    router.get("/all", isAuthenticated, isAdmin, controller.getAllDeliveries);
    return router;
}
