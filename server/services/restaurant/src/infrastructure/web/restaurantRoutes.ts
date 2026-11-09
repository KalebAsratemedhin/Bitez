import express from "express";
import multer from "multer";
import { isAuthenticated } from "@bitez/shared";
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

export function createRestaurantRoutes(
  controller: RestaurantController,
  ownerDashboard?: (req: express.Request, res: express.Response, next: express.NextFunction) => void,
): express.Router {
  const router = express.Router();
  if (ownerDashboard) {
    router.get("/dashboard/owner", isAuthenticated, ownerDashboard);
  }
  router.get("/mine", isAuthenticated, controller.getMine);
  router.post("/", isAuthenticated, maybeUploadLogo, controller.create);
  router.put("/:id", isAuthenticated, maybeUploadLogo, controller.update);
  router.delete("/:id", isAuthenticated, controller.delete);
  router.get("/active", controller.getActive);
  router.get("/:id", controller.getById);
  return router;
}
