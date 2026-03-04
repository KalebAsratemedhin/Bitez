import express from "express";
import { isAuthenticated, optionalAuth } from "./middlewares/auth.js";
export function createRatingRoutes(restaurantController, ratingRepository, options) {
    const router = express.Router();
    router.get("/top/restaurants", restaurantController.getTopRestaurants);
    router.get("/top/menu-items", restaurantController.getTopMenuItems);
    router.get("/:entityType/:entityId", optionalAuth, async (req, res) => {
        const entityType = String(req.params.entityType ?? "");
        const entityId = String(req.params.entityId ?? "");
        const user = req.user;
        const rating = user
            ? await ratingRepository.getUserRating(entityType, entityId, user.id)
            : 0;
        res.json({ rating });
    });
    router.put("/:entityType/:entityId", isAuthenticated, async (req, res) => {
        const authReq = req;
        const entityType = String(req.params.entityType ?? "");
        const entityId = String(req.params.entityId ?? "");
        const rating = Number(req.body?.rating);
        const userId = authReq.user.id;
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            res.status(400).json({ error: "Rating must be a number between 1 and 5" });
            return;
        }
        const normalizedType = entityType.toLowerCase();
        if (normalizedType === "delivery_person") {
            const { deliveryServiceUrl, eventPublisher } = options ?? {};
            if (!deliveryServiceUrl || !eventPublisher) {
                res.status(503).json({ error: "Delivery person rating is not configured." });
                return;
            }
            const base = deliveryServiceUrl.replace(/\/$/, "");
            const url = `${base}/delivery-person/${encodeURIComponent(entityId)}/delivered-to/${encodeURIComponent(userId)}`;
            let delivered = false;
            try {
                const resp = await fetch(url);
                if (resp.ok) {
                    const data = (await resp.json());
                    delivered = Boolean(data.delivered);
                }
            }
            catch {
                // ignore
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
