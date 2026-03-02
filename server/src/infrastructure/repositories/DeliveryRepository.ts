import Delivery from "@models/delivery.js";
import type { IDeliveryRepository } from "@domain/interfaces/index.js";

export class DeliveryRepository implements IDeliveryRepository {
  async findById(id: string, populate: string[] = []) {
    let query = Delivery.findById(id);
    if (populate.includes("deliveryPersonId")) query = query.populate("deliveryPersonId");
    if (populate.includes("orderId")) {
      query = query.populate({
        path: "orderId",
        populate: [{ path: "customerID", select: "name phoneNumber" }],
      });
    }
    return query.lean();
  }

  async create(data: Record<string, unknown>) {
    const delivery = new Delivery(data);
    return delivery.save();
  }

  async findAllPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      Delivery.find()
        .populate("deliveryPersonId")
        .populate("orderId")
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments(),
    ]);
    return { deliveries, total };
  }

  async findByDeliveryPersonId(
    deliveryPersonId: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      Delivery.find({ deliveryPersonId })
        .sort({ createdAt: -1 })
        .populate({
          path: "orderId",
          populate: [
            { path: "customerID", select: ["name", "phoneNumber"] },
            { path: "restaurantID", select: ["name", "location"] },
          ],
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments({ deliveryPersonId }),
    ]);
    return { deliveries, total };
  }

  async findByCustomerId(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const deliveries = await Delivery.find()
      .populate({
        path: "orderId",
        match: { customerID: customerId },
        populate: [
          { path: "customerID", select: ["name", "phoneNumber"] },
          { path: "restaurantID", select: "name" },
        ],
      })
      .populate({
        path: "deliveryPersonId",
        select: "rating",
        populate: { path: "userId", select: ["name", "phoneNumber", "profileImage"] },
      })
      .skip(skip)
      .limit(limit)
      .lean();
    const filtered = deliveries.filter((d: { orderId?: unknown }) => d.orderId);
    return { deliveries: filtered, total: filtered.length };
  }

  async hasDeliveredToCustomer(deliveryPersonId: string, customerUserId: string): Promise<boolean> {
    const deliveries = await Delivery.find({
      deliveryPersonId,
      status: "delivered",
    })
      .populate("orderId", "customerID")
      .lean();
    return deliveries.some((d) => {
      const o = d as { orderId?: { customerID?: { _id?: unknown } | unknown } };
      const cid = o.orderId?.customerID;
      const id =
        cid && typeof cid === "object" && cid !== null && "_id" in cid
          ? String((cid as { _id: unknown })._id)
          : String(cid);
      return id === customerUserId;
    });
  }

  async updateStatus(deliveryId: string, status: string) {
    await Delivery.findByIdAndUpdate(deliveryId, { status });
  }
}
