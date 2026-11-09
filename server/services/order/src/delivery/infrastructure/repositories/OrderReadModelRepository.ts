import type {
  IOrderReadModelRepository,
  OrderReadModelItem,
} from "../../domain/interfaces/OrderReadModelRepository.js";
import OrderReadModel from "../persistence/models/orderReadModel.js";

function toItem(doc: Record<string, unknown>): OrderReadModelItem {
  const coords = doc.coordinates as { lat?: number; lng?: number } | undefined;
  return {
    orderId: String(doc.orderId ?? ""),
    customerId: String(doc.customerId ?? ""),
    restaurantId: String(doc.restaurantId ?? ""),
    totalAmount: Number(doc.totalAmount ?? 0),
    status: String(doc.status ?? ""),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(String(doc.createdAt)),
    deliveryAddress: doc.deliveryAddress != null ? String(doc.deliveryAddress) : undefined,
    coordinates: coords != null ? coords : undefined,
  };
}

export class OrderReadModelRepository implements IOrderReadModelRepository {
  async upsert(item: Partial<OrderReadModelItem> & { orderId: string }): Promise<void> {
    const update: Record<string, unknown> = { orderId: item.orderId };
    if (item.customerId != null) update.customerId = item.customerId;
    if (item.restaurantId != null) update.restaurantId = item.restaurantId;
    if (item.totalAmount != null) update.totalAmount = item.totalAmount;
    if (item.status != null) update.status = item.status;
    if (item.createdAt != null) update.createdAt = item.createdAt;
    if (item.deliveryAddress != null) update.deliveryAddress = item.deliveryAddress;
    if (item.coordinates != null) update.coordinates = item.coordinates;
    await OrderReadModel.findOneAndUpdate(
      { orderId: item.orderId },
      { $set: update },
      { upsert: true }
    );
  }

  async findByOrderId(orderId: string): Promise<OrderReadModelItem | null> {
    const doc = await OrderReadModel.findOne({ orderId }).lean();
    if (!doc) return null;
    return toItem(doc as Record<string, unknown>);
  }
}
