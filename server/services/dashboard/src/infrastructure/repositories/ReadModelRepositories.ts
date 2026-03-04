import OrderReadModel from "../persistence/models/orderReadModel.js";
import RestaurantReadModel from "../persistence/models/restaurantReadModel.js";
import DeliveryReadModel from "../persistence/models/deliveryReadModel.js";

export function upsertOrderReadModel(data: {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}): Promise<unknown> {
  return OrderReadModel.findOneAndUpdate(
    { orderId: data.orderId },
    {
      $set: {
        customerId: data.customerId,
        restaurantId: data.restaurantId,
        totalAmount: data.totalAmount,
        status: data.status,
        createdAt: data.createdAt,
      },
    },
    { upsert: true, new: true }
  ).lean();
}

export function upsertRestaurantReadModel(data: {
  restaurantId: string;
  ownerId: string;
  name: string;
}): Promise<unknown> {
  return RestaurantReadModel.findOneAndUpdate(
    { restaurantId: data.restaurantId },
    { $set: { ownerId: data.ownerId, name: data.name } },
    { upsert: true, new: true }
  ).lean();
}

export function upsertDeliveryReadModel(data: {
  deliveryId: string;
  orderId: string;
  deliveryPersonUserId: string;
  status: string;
  createdAt: Date;
}): Promise<unknown> {
  return DeliveryReadModel.findOneAndUpdate(
    { deliveryId: data.deliveryId },
    {
      $set: {
        orderId: data.orderId,
        deliveryPersonUserId: data.deliveryPersonUserId,
        status: data.status,
        createdAt: data.createdAt,
      },
    },
    { upsert: true, new: true }
  ).lean();
}

export async function findOrdersByCustomerId(customerId: string): Promise<unknown[]> {
  return OrderReadModel.find({ customerId }).sort({ createdAt: -1 }).lean();
}

export async function findRestaurantsByOwnerId(ownerId: string): Promise<unknown[]> {
  return RestaurantReadModel.find({ ownerId }).lean();
}

export async function findOrdersByRestaurantIds(restaurantIds: string[]): Promise<unknown[]> {
  if (restaurantIds.length === 0) return [];
  return OrderReadModel.find({ restaurantId: { $in: restaurantIds } }).lean();
}

export async function findDeliveriesByDeliveryPersonUserId(
  deliveryPersonUserId: string
): Promise<unknown[]> {
  return DeliveryReadModel.find({ deliveryPersonUserId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getRestaurantNameById(restaurantId: string): Promise<string> {
  const r = await RestaurantReadModel.findOne({ restaurantId }).lean();
  return (r as { name?: string } | null)?.name ?? "Unknown";
}

export async function getRestaurantNamesByIds(restaurantIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (restaurantIds.length === 0) return map;
  const list = await RestaurantReadModel.find({ restaurantId: { $in: restaurantIds } }).lean();
  for (const r of list) {
    const x = r as { restaurantId?: string; name?: string };
    if (x.restaurantId) map.set(x.restaurantId, x.name ?? "Unknown");
  }
  return map;
}
