import type { IDeliveryRepository } from "../../domain/interfaces/DeliveryRepository.js";
import Delivery from "../persistence/models/delivery.js";

export class DeliveryRepository implements IDeliveryRepository {
  async findById(id: string, populate: string[] = []): Promise<unknown | null> {
    let query = Delivery.findById(id);
    if (populate.includes("deliveryPersonId")) query = query.populate("deliveryPersonId");
    return query.lean();
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    const delivery = new Delivery(data);
    return delivery.save();
  }

  async findAllPaginated(
    page = 1,
    limit = 10,
  ): Promise<{ deliveries: unknown[]; total: number }> {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      Delivery.find().populate("deliveryPersonId").skip(skip).limit(limit).lean(),
      Delivery.countDocuments(),
    ]);
    return { deliveries, total };
  }

  async findByDeliveryPersonId(
    deliveryPersonId: string,
    page = 1,
    limit = 10,
  ): Promise<{ deliveries: unknown[]; total: number }> {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      Delivery.find({ deliveryPersonId })
        .sort({ createdAt: -1 })
        .populate("deliveryPersonId")
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments({ deliveryPersonId }),
    ]);
    return { deliveries, total };
  }

  async findByCustomerId(
    customerId: string,
    page = 1,
    limit = 10,
  ): Promise<{ deliveries: unknown[]; total: number }> {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      Delivery.find({ customerId })
        .sort({ createdAt: -1 })
        .populate("deliveryPersonId")
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments({ customerId }),
    ]);
    return { deliveries, total };
  }

  async hasDeliveredToCustomer(
    deliveryPersonId: string,
    customerUserId: string,
  ): Promise<boolean> {
    const count = await Delivery.countDocuments({
      deliveryPersonId,
      status: "delivered",
      customerId: customerUserId,
    });
    return count > 0;
  }

  async updateStatus(deliveryId: string, status: string): Promise<void> {
    await Delivery.findByIdAndUpdate(deliveryId, { status });
  }
}
