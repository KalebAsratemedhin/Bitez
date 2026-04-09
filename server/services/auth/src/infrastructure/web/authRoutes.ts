import express from "express";
import multer from "multer";

import { isAuthenticated } from "./middlewares/auth.js";
import { requireInternalServiceToken } from "./middlewares/internalAuth.js";
import type { AuthController } from "../controllers/AuthController.js";

const upload = multer();

export function createAuthRoutes(controller: AuthController): express.Router {
  const router = express.Router();
  router.post("/signup", controller.signup);
  router.post("/signin", controller.signin);
  router.post("/logout", isAuthenticated, controller.logout);
  router.get("/current-user", isAuthenticated, controller.getCurrentUser);
  router.get("/internal/user/:id", requireInternalServiceToken, controller.getInternalUserById);
  router.put("/profile", isAuthenticated, upload.any(), controller.updateProfile);
  return router;
}
