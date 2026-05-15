import type { IDeliveredToRepository } from "@domain/interfaces/DeliveredToRepository.js";
import DeliveredTo from "../persistence/models/deliveredTo.js";

export class DeliveredToRepository implements IDeliveredToRepository {
  async record(deliveryPersonId: string, customerUserId: string): Promise<void> {
    await DeliveredTo.findOneAndUpdate(
      { deliveryPersonId, customerUserId },
      { deliveryPersonId, customerUserId },
      { upsert: true }
    );
  }

  async hasDeliveredTo(deliveryPersonId: string, customerUserId: string): Promise<boolean> {
    const doc = await DeliveredTo.findOne({ deliveryPersonId, customerUserId }).lean();
    return doc != null;
  }
}
