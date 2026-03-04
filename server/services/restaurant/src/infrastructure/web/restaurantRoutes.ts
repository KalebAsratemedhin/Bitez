import express from "express";
import multer from "multer";
import { isAuthenticated } from "./middlewares/auth.js";
import type { RestaurantController } from "../controllers/RestaurantController.js";

const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

function maybeUploadLogo(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (req.is("multipart/form-data")) {
    uploadLogo.single("logo")(req, res, (err: unknown) => {
      if (err) return res.status(400).json({ error: (err as Error).message });
      next();
    });
  } else next();
}

export function createRestaurantRoutes(controller: RestaurantController): express.Router {
  const router = express.Router();
  router.get("/mine", isAuthenticated, controller.getMine);
  router.post("/", isAuthenticated, maybeUploadLogo, controller.create);
  router.put("/:id", isAuthenticated, maybeUploadLogo, controller.update);
  router.delete("/:id", isAuthenticated, controller.delete);
  router.get("/active", controller.getActive);
  router.get("/:id", controller.getById);
  return router;
}
