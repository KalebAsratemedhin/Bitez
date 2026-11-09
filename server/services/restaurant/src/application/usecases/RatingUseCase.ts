import { RoutingKeys, type DeliveryPersonRatingUpdatedEvent } from "@bitez/contracts";
import type { IEventPublisher } from "../../domain/interfaces/EventPublisher.js";
import type { IDeliveredToRepository } from "../../domain/interfaces/DeliveredToRepository.js";
import type { RatingRepository } from "../../infrastructure/repositories/RatingRepository.js";

export interface RatingUseCaseDeps {
  ratingRepository: RatingRepository;
  eventPublisher: IEventPublisher;
  deliveredToRepository: IDeliveredToRepository;
}

export class RatingUseCase {
  constructor(private readonly deps: RatingUseCaseDeps) {}

  async getUserRating(entityType: string, entityId: string, userId?: string): Promise<number> {
    if (!userId) return 0;
    return this.deps.ratingRepository.getUserRating(entityType, entityId, userId);
  }

  async setRating(input: {
    entityType: string;
    entityId: string;
    userId: string;
    rating: number;
  }): Promise<{ rating: number }> {
    const { entityType, entityId, userId, rating } = input;
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error("Rating must be a number between 1 and 5");
    }

    const normalizedType = entityType.toLowerCase();
    if (normalizedType === "delivery_person") {
      const delivered = await this.deps.deliveredToRepository.hasDeliveredTo(entityId, userId);
      if (!delivered) {
        throw new Error(
          "You can only rate a delivery person after they have delivered an order to you.",
        );
      }
      await this.deps.ratingRepository.setRating(entityType, entityId, userId, rating);
      const averageRating = await this.deps.ratingRepository.getAverageRating(normalizedType, entityId);
      const payload: DeliveryPersonRatingUpdatedEvent = {
        deliveryPersonId: entityId,
        averageRating: Math.round(averageRating * 10) / 10,
      };
      await this.deps.eventPublisher.publish(RoutingKeys.DeliveryPersonRatingUpdated, payload);
      return { rating };
    }

    await this.deps.ratingRepository.setRating(entityType, entityId, userId, rating);
    return { rating };
  }
}
