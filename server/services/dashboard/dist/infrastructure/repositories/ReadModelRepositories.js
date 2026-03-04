import OrderReadModel from "../persistence/models/orderReadModel.js";
import RestaurantReadModel from "../persistence/models/restaurantReadModel.js";
import DeliveryReadModel from "../persistence/models/deliveryReadModel.js";
export function upsertOrderReadModel(data) {
    return OrderReadModel.findOneAndUpdate({ orderId: data.orderId }, {
        $set: {
            customerId: data.customerId,
            restaurantId: data.restaurantId,
            totalAmount: data.totalAmount,
            status: data.status,
            createdAt: data.createdAt,
        },
    }, { upsert: true, new: true }).lean();
}
export function upsertRestaurantReadModel(data) {
    return RestaurantReadModel.findOneAndUpdate({ restaurantId: data.restaurantId }, { $set: { ownerId: data.ownerId, name: data.name } }, { upsert: true, new: true }).lean();
}
export function upsertDeliveryReadModel(data) {
    return DeliveryReadModel.findOneAndUpdate({ deliveryId: data.deliveryId }, {
        $set: {
            orderId: data.orderId,
            deliveryPersonUserId: data.deliveryPersonUserId,
            status: data.status,
            createdAt: data.createdAt,
        },
    }, { upsert: true, new: true }).lean();
}
export async function findOrdersByCustomerId(customerId) {
    return OrderReadModel.find({ customerId }).sort({ createdAt: -1 }).lean();
}
export async function findRestaurantsByOwnerId(ownerId) {
    return RestaurantReadModel.find({ ownerId }).lean();
}
export async function findOrdersByRestaurantIds(restaurantIds) {
    if (restaurantIds.length === 0)
        return [];
    return OrderReadModel.find({ restaurantId: { $in: restaurantIds } }).lean();
}
export async function findDeliveriesByDeliveryPersonUserId(deliveryPersonUserId) {
    return DeliveryReadModel.find({ deliveryPersonUserId })
        .sort({ createdAt: -1 })
        .lean();
}
export async function getRestaurantNameById(restaurantId) {
    const r = await RestaurantReadModel.findOne({ restaurantId }).lean();
    return r?.name ?? "Unknown";
}
export async function getRestaurantNamesByIds(restaurantIds) {
    const map = new Map();
    if (restaurantIds.length === 0)
        return map;
    const list = await RestaurantReadModel.find({ restaurantId: { $in: restaurantIds } }).lean();
    for (const r of list) {
        const x = r;
        if (x.restaurantId)
            map.set(x.restaurantId, x.name ?? "Unknown");
    }
    return map;
}
