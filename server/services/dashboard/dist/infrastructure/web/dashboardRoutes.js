import express from "express";
import { isAuthenticated, isDeliveryPerson } from "./middlewares/auth.js";
export function createDashboardRoutes(controller) {
    const router = express.Router();
    router.get("/customer", isAuthenticated, controller.getCustomerDashboard);
    router.get("/restaurant-owner", isAuthenticated, controller.getRestaurantOwnerDashboard);
    router.get("/delivery-person", isAuthenticated, isDeliveryPerson, controller.getDeliveryPersonDashboard);
    return router;
}
