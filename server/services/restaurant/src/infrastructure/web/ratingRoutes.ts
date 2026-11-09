import express from "express";
import { AppError, isAuthenticated, optionalAuth, type AuthenticatedRequest } from "@bitez/shared";
import type { RestaurantController } from "../controllers/RestaurantController.js";
import type { RatingUseCase } from "../../application/usecases/RatingUseCase.js";

export function createRatingRoutes(
  restaurantController: RestaurantController,
  ratingUseCase: RatingUseCase,
): express.Router {
  const router = express.Router();

  router.get("/top/restaurants", restaurantController.getTopRestaurants);
  router.get("/top/menu-items", restaurantController.getTopMenuItems);

  router.get("/:entityType/:entityId", optionalAuth, async (req, res, next) => {
    try {
      const entityType = String(req.params.entityType ?? "");
      const entityId = String(req.params.entityId ?? "");
      const userId = (req as AuthenticatedRequest).user?.id;
      const rating = await ratingUseCase.getUserRating(entityType, entityId, userId);
      res.json({ rating });
    } catch (e) {
      next(e);
    }
  });

  router.put("/:entityType/:entityId", isAuthenticated, async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await ratingUseCase.setRating({
        entityType: String(req.params.entityType ?? ""),
        entityId: String(req.params.entityId ?? ""),
        userId: authReq.user!.id,
        rating: Number(req.body?.rating),
      });
      res.json({ message: "OK", rating: result.rating });
    } catch (e) {
      const message = (e as Error).message ?? "Invalid request";
      if (message.includes("only rate")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message, expose: true, cause: e }));
        return;
      }
      if (message.includes("Rating must")) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  });

  return router;
}
