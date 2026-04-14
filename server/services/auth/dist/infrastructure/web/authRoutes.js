import express from "express";
import multer from "multer";
import { isAuthenticated } from "./middlewares/auth.js";
import { requireInternalServiceToken } from "@bitez/shared";
const upload = multer();
export function createAuthRoutes(controller) {
    const router = express.Router();
    router.post("/signup", controller.signup);
    router.post("/signin", controller.signin);
    router.post("/logout", isAuthenticated, controller.logout);
    router.get("/current-user", isAuthenticated, controller.getCurrentUser);
    router.get("/internal/user/:id", requireInternalServiceToken, controller.getInternalUserById);
    router.put("/profile", isAuthenticated, upload.any(), controller.updateProfile);
    return router;
}
