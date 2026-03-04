import express from "express";
import multer from "multer";
import { isAuthenticated } from "./middlewares/auth.js";
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
export function createMenuRoutes(controller) {
    const router = express.Router();
    router.post("/createMenu/:restaurantId", isAuthenticated, upload.array("itemPictures", 20), controller.createMenu);
    router.get("/getMenu/:restaurantId", isAuthenticated, controller.getMenuByRestaurant);
    router.get("/by-id/:id", isAuthenticated, controller.getMenuById);
    router.put("/updateMenu/:menuId", isAuthenticated, upload.array("itemPictures", 20), controller.updateMenu);
    router.delete("/deleteMenu/:menuId", isAuthenticated, controller.deleteMenu);
    return router;
}
