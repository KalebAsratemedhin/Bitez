import mongoose from "mongoose";
import Order from "../persistence/models/order.js";
export class OrderRepository {
    async create(data) {
        const order = new Order(data);
        return order.save();
    }
    async findById(id) {
        return Order.findById(id).lean();
    }
    async find(filter = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find(filter).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);
        return { orders, total };
    }
    async findByCustomerId(customerId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find({ customerID: customerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ customerID: customerId }),
        ]);
        return { orders, total };
    }
    async findOrdersByCustomerId(customerId) {
        return Order.find({ customerID: customerId })
            .sort({ createdAt: -1 })
            .lean();
    }
    async findByRestaurantId(restaurantId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find({ restaurantID: restaurantId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ restaurantID: restaurantId }),
        ]);
        return { orders, total };
    }
    async findOrdersByRestaurantIds(restaurantIds) {
        if (restaurantIds.length === 0)
            return [];
        return Order.find({
            restaurantID: { $in: restaurantIds.map((id) => new mongoose.Types.ObjectId(id)) },
        }).lean();
    }
    async updateStatus(orderId, status) {
        return Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();
    }
    async updatePaymentCompleted(orderId, paymentCompleted) {
        return Order.findByIdAndUpdate(orderId, { paymentCompleted }, { new: true }).lean();
    }
}
