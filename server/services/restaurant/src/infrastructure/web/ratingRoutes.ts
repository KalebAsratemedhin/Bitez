import express from "express";
import type { RestaurantController } from "../controllers/RestaurantController.js";
import type { RatingRepository } from "../repositories/RatingRepository.js";
import type { IEventPublisher } from "../../domain/interfaces/EventPublisher.js";
import type { IDeliveredToRepository } from "../../domain/interfaces/DeliveredToRepository.js";
import { isAuthenticated, optionalAuth } from "./middlewares/auth.js";
import type { AuthenticatedRequest } from "./middlewares/auth.js";

export function createRatingRoutes(
  restaurantController: RestaurantController,
  ratingRepository: RatingRepository,
  options?: {
    deliveryServiceUrl?: string;
    eventPublisher: IEventPublisher;
    deliveredToRepository?: IDeliveredToRepository;
  },
): express.Router {
  const router = express.Router();

  router.get("/top/restaurants", restaurantController.getTopRestaurants);
  router.get("/top/menu-items", restaurantController.getTopMenuItems);

  router.get("/:entityType/:entityId", optionalAuth, async (req: express.Request, res: express.Response) => {
    const entityType = String(req.params.entityType ?? "");
    const entityId = String(req.params.entityId ?? "");
    const user = (req as AuthenticatedRequest).user;
    const rating = user
      ? await ratingRepository.getUserRating(entityType, entityId, user.id)
      : 0;
    res.json({ rating });
  });

  router.put("/:entityType/:entityId", isAuthenticated, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthenticatedRequest;
    const entityType = String(req.params.entityType ?? "");
    const entityId = String(req.params.entityId ?? "");
    const rating = Number(req.body?.rating);
    const userId = authReq.user!.id;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be a number between 1 and 5" });
      return;
    }

    const normalizedType = entityType.toLowerCase();
    if (normalizedType === "delivery_person") {
      const { eventPublisher, deliveredToRepository, deliveryServiceUrl } = options ?? {};
      if (!eventPublisher) {
        res.status(503).json({ error: "Delivery person rating is not configured." });
        return;
      }
      let delivered = false;
      if (deliveredToRepository) {
        delivered = await deliveredToRepository.hasDeliveredTo(entityId, userId);
      } else if (deliveryServiceUrl) {
        const base = deliveryServiceUrl.replace(/\/$/, "");
        const url = `${base}/delivery-person/${encodeURIComponent(entityId)}/delivered-to/${encodeURIComponent(userId)}`;
        try {
          const token = process.env.INTERNAL_SERVICE_TOKEN?.trim();
          const headers: Record<string, string> = {};
          if (token) headers["X-Internal-Token"] = token;
          const resp = await fetch(url, { headers });
          if (resp.ok) {
            const data = (await resp.json()) as { delivered?: boolean };
            delivered = Boolean(data.delivered);
          }
        } catch {
          // leave delivered false
        }
      }
      if (!delivered) {
        res.status(403).json({
          error: "You can only rate a delivery person after they have delivered an order to you.",
        });
        return;
      }
      await ratingRepository.setRating(entityType, entityId, userId, rating);
      const averageRating = await ratingRepository.getAverageRating(normalizedType, entityId);
      await eventPublisher.publish("delivery_person.rating.updated", {
        deliveryPersonId: entityId,
        averageRating: Math.round(averageRating * 10) / 10,
      });
      res.json({ message: "OK", rating });
      return;
    }

    await ratingRepository.setRating(entityType, entityId, userId, rating);
    res.json({ message: "OK", rating });
  });

  return router;
}
