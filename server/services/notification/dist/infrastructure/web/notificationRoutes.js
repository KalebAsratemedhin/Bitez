import express from "express";
import { isAuthenticated } from "./middlewares/auth.js";
export function createNotificationRoutes(controller) {
    const router = express.Router();
    router.post("/notify", controller.notify);
    router.get("/", isAuthenticated, controller.list);
    router.put("/mark-as-seen/:id", isAuthenticated, controller.markAsSeen);
    return router;
}
