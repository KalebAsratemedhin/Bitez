import mongoose from "mongoose";
import Order from "@models/order.js";
import type {
  IOrderRepository,
  OrderCreateInput,
  PaginatedOrders,
} from "@domain/interfaces/index.js";

export class OrderRepository implements IOrderRepository {
  async create(data: OrderCreateInput) {
    const order = new Order(data);
    return order.save();
  }

  async findById(id: string) {
    return Order.findById(id).populate("restaurantID").lean();
  }

  async find(
    filter: object = {},
    page = 1,
    limit = 10,
  ): Promise<PaginatedOrders> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .skip(skip)
        .limit(limit)
        .populate("customerID")
        .populate("restaurantID")
        .lean(),
      Order.countDocuments(filter),
    ]);
    return { orders, total };
  }

  async findByCustomerId(
    customerId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedOrders> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ customerID: customerId })
        .sort({ createdAt: -1 })
        .populate("restaurantID")
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ customerID: customerId }),
    ]);
    return { orders, total };
  }

  async findOrdersByCustomerId(customerId: string): Promise<unknown[]> {
    return Order.find({ customerID: customerId })
      .populate("restaurantID", "name")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByRestaurantId(
    restaurantId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedOrders> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ restaurantID: restaurantId })
        .sort({ createdAt: -1 })
        .populate("customerID")
        .populate("restaurantID")
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ restaurantID: restaurantId }),
    ]);
    return { orders, total };
  }

  async findOrdersByRestaurantIds(restaurantIds: string[]): Promise<unknown[]> {
    if (restaurantIds.length === 0) return [];
    return Order.find({ restaurantID: { $in: restaurantIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .populate("restaurantID", "name")
      .lean();
  }

  async updateStatus(orderId: string, status: string) {
    return Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();
  }

  async updatePaymentCompleted(orderId: string, paymentCompleted: boolean) {
    return Order.findByIdAndUpdate(orderId, { paymentCompleted }, { new: true }).lean();
  }
}
