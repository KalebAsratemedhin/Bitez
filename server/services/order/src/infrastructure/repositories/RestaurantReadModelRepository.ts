import type {
  IRestaurantReadModelRepository,
  RestaurantReadModelItem,
} from "../../domain/interfaces/RestaurantReadModelRepository.js";
import RestaurantReadModel from "../persistence/models/restaurantReadModel.js";

export class RestaurantReadModelRepository implements IRestaurantReadModelRepository {
  async upsert(item: RestaurantReadModelItem): Promise<void> {
    await RestaurantReadModel.findOneAndUpdate(
      { restaurantId: item.restaurantId },
      { $set: { name: item.name, status: item.status, ownerId: item.ownerId } },
      { upsert: true }
    );
  }

  async findById(restaurantId: string): Promise<RestaurantReadModelItem | null> {
    const doc = await RestaurantReadModel.findOne({ restaurantId }).lean();
    if (!doc) return null;
    const d = doc as { restaurantId?: string; name?: string; status?: string; ownerId?: string };
    return {
      restaurantId: String(d.restaurantId ?? ""),
      name: String(d.name ?? ""),
      status: String(d.status ?? ""),
      ownerId: d.ownerId != null ? String(d.ownerId) : undefined,
    };
  }
}
