import express from "express";
import { isAuthenticated } from "@bitez/shared";
import type { NotificationController } from "../controllers/NotificationController.js";

/** Mounted at /notifications on the order service (no separate notification service). */
export function createNotificationRoutes(controller: NotificationController): express.Router {
  const router = express.Router();
  router.get("/", isAuthenticated, controller.list);
  router.put("/mark-as-seen/:id", isAuthenticated, controller.markAsSeen);
  return router;
}
