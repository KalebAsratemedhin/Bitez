import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "@middlewares/auth.js";
import type { RestaurantController } from "@infrastructure/controllers/RestaurantController.js";

const RESTAURANT_UPLOADS = path.join(process.cwd(), "uploads", "restaurants");
if (!fs.existsSync(RESTAURANT_UPLOADS)) {
  fs.mkdirSync(RESTAURANT_UPLOADS, { recursive: true });
}

const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (
      _req: express.Request,
      _file: { originalname: string },
      cb: (error: Error | null, destination: string) => void
    ) => cb(null, RESTAURANT_UPLOADS),
    filename: (
      _req: express.Request,
      file: { originalname: string },
      cb: (error: Error | null, filename: string) => void
    ) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
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
