import express from "express";

import { isAuthenticated } from "@middlewares/auth.js";
import type { AuthController } from "@infrastructure/controllers/AuthController.js";

export function createAuthRoutes(controller: AuthController): express.Router {
  const router = express.Router();
  router.post("/signup", controller.signup);
  router.post("/signin", controller.signin);
  router.post("/logout", isAuthenticated, controller.logout);
  router.get("/current-user", isAuthenticated, controller.getCurrentUser);
  return router;
}
