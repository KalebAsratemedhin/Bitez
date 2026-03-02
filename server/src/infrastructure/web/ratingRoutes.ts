import express from "express";
import type { RestaurantController } from "@infrastructure/controllers/RestaurantController.js";
import type { RatingRepository } from "@infrastructure/repositories/RatingRepository.js";
import type { DeliveryRepository } from "@infrastructure/repositories/DeliveryRepository.js";
import { isAuthenticated, optionalAuth } from "@middlewares/auth.js";
import type { AuthenticatedRequest } from "@middlewares/auth.js";
import DeliveryPerson from "@models/deliveryPerson.js";

export function createRatingRoutes(
  restaurantController: RestaurantController,
  ratingRepository: RatingRepository,
  deliveryRepository: DeliveryRepository
): express.Router {
  const router = express.Router();

  router.get("/top/restaurants", restaurantController.getTopRestaurants);
  router.get("/top/menu-items", (_req: express.Request, res: express.Response) => {
    res.json([]);
  });

  router.get("/:entityType/:entityId", optionalAuth, async (req: express.Request, res: express.Response) => {
    const { entityType, entityId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const rating = user
      ? await ratingRepository.getUserRating(entityType, entityId, user.id)
      : 0;

    res.json({ rating });
  });

  router.put("/:entityType/:entityId", isAuthenticated, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthenticatedRequest;
    const { entityType, entityId } = req.params;
    const rating = Number(req.body?.rating);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be a number between 1 and 5" });
      return;
    }

    const normalizedType = entityType.toLowerCase();
    if (normalizedType === "delivery_person") {
      const canRate = await deliveryRepository.hasDeliveredToCustomer(entityId, authReq.user!.id);
      if (!canRate) {
        res.status(403).json({ error: "You can only rate a delivery person after a completed delivery." });
        return;
      }
    }

    await ratingRepository.setRating(entityType, entityId, authReq.user!.id, rating);

    if (normalizedType === "delivery_person") {
      const avg = await ratingRepository.getAverageRating("delivery_person", entityId);
      await DeliveryPerson.findByIdAndUpdate(entityId, { rating: Math.round(avg * 10) / 10 });
    }

    res.json({ message: "OK", rating });
  });

  return router;
}
