import express from "express";
import multer from "multer";
import { isAuthenticated } from "./middlewares/auth.js";
import type { MenuController } from "../controllers/MenuController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
