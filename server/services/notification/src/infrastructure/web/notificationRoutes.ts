import express from "express";
import { isAuthenticated } from "./middlewares/auth.js";
import type { NotificationController } from "../controllers/NotificationController.js";

export function createNotificationRoutes(controller: NotificationController): express.Router {
  const router = express.Router();
  router.post("/notify", controller.notify);
  router.get("/", isAuthenticated, controller.list);
  router.put("/mark-as-seen/:id", isAuthenticated, controller.markAsSeen);
  return router;
}
