import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "@middlewares/auth.js";
import type { MenuController } from "@infrastructure/controllers/MenuController.js";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "menus");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

export function createMenuRoutes(controller: MenuController): express.Router {
  const router = express.Router();
  router.post(
    "/createMenu/:restaurantId",
    isAuthenticated,
    upload.array("itemPictures", 20),
    controller.createMenu
  );
  router.get("/getMenu/:restaurantId", isAuthenticated, controller.getMenuByRestaurant);
  router.get("/:id", isAuthenticated, controller.getMenuById);
  router.put(
    "/updateMenu/:menuId",
    isAuthenticated,
    upload.array("itemPictures", 20),
    controller.updateMenu
  );
  router.delete("/deleteMenu/:menuId", isAuthenticated, controller.deleteMenu);
  return router;
}
