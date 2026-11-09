import type {
  DeliveryPersonRatingReadModel,
  IDeliveryPersonRepository,
} from "../../domain/interfaces/DeliveryPersonRepository.js";
import DeliveryPersonRatingReadModelModel from "../persistence/models/deliveryPersonRatingReadModel.js";

export class DeliveryPersonRatingReadModelRepository implements IDeliveryPersonRepository {
  async findByUserId(userId: string): Promise<DeliveryPersonRatingReadModel | null> {
    const doc = await DeliveryPersonRatingReadModelModel.findOne({ userId }).lean();
    if (!doc) return null;
    return {
      userId: String(doc.userId),
      deliveryPersonId: String(doc.deliveryPersonId),
      rating: typeof doc.rating === "number" ? doc.rating : 0,
    };
  }

  async upsertRegistration(input: { userId: string; deliveryPersonId: string }): Promise<void> {
    await DeliveryPersonRatingReadModelModel.findOneAndUpdate(
      { userId: input.userId },
      {
        $set: {
          userId: input.userId,
          deliveryPersonId: input.deliveryPersonId,
        },
        $setOnInsert: { rating: 0 },
      },
      { upsert: true },
    );
  }

  async updateRatingByDeliveryPersonId(deliveryPersonId: string, rating: number): Promise<void> {
    await DeliveryPersonRatingReadModelModel.findOneAndUpdate(
      { deliveryPersonId },
      { rating },
    );
  }
}
