import Delivery from "@models/delivery.js";
import DeliveryPerson from "@models/deliveryPerson.js";
import type { IDeliveryPersonRepository } from "@domain/interfaces/index.js";

const ACTIVE_DELIVERY_STATUSES = ["assigned", "picked_up", "on_the_way"];

export class DeliveryPersonRepository implements IDeliveryPersonRepository {
  async create(data: Record<string, unknown>) {
    return DeliveryPerson.create(data);
  }

  async findById(id: string, populate: string[] = []) {
    let query = DeliveryPerson.findById(id);
    if (populate.includes("userId")) query = query.populate("userId");
    return query.lean();
  }

  async findByUserId(userId: string) {
    return DeliveryPerson.findOne({ userId }).lean();
  }

  async findAvailableDeliveryPersonId(): Promise<string | null> {
    const claimed = await DeliveryPerson.findOneAndUpdate(
      { status: "free" },
      { status: "busy" },
      { new: true },
    ).lean();
    if (claimed) {
      return (claimed as { _id: unknown })._id?.toString() ?? null;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deliveries = await Delivery.aggregate([
      {
        $match: {
          status: { $in: ACTIVE_DELIVERY_STATUSES },
          estimatedDeliveryTime: { $gte: now },
        },
      },
      {
        $lookup: {
          from: "deliverypeople",
          localField: "deliveryPersonId",
          foreignField: "_id",
          as: "deliveryPerson",
        },
      },
      { $unwind: "$deliveryPerson" },
      {
        $match: {
          "deliveryPerson.status": { $in: ["busy", "unavailable"] },
        } as Record<string, unknown>,
      },
      {
        $group: {
          _id: "$deliveryPersonId",
          earliestDeliveryTime: { $min: "$estimatedDeliveryTime" },
          deliveriesToday: {
            $sum: {
              $cond: [{ $gte: ["$estimatedDeliveryTime", todayStart] }, 1, 0],
            },
          },
        },
      },
      { $sort: { earliestDeliveryTime: 1, deliveriesToday: 1 } },
      { $limit: 1 },
    ]);

    if (deliveries.length > 0) return deliveries[0]._id?.toString() ?? null;
    return null;
  }

  async updateStatus(deliveryPersonId: string, status: string) {
    await DeliveryPerson.findByIdAndUpdate(deliveryPersonId, { status });
  }

  async countPendingDeliveries(deliveryPersonId: string) {
    return Delivery.countDocuments({
      deliveryPersonId,
      status: { $in: ACTIVE_DELIVERY_STATUSES },
    });
  }

  async setPersonBusy(deliveryPersonId: string) {
    const doc = await DeliveryPerson.findById(deliveryPersonId);
    if (doc && doc.status === "free") {
      doc.status = "busy";
      await doc.save();
    }
  }

  async setPersonFreeIfNoPending(deliveryPersonId: string) {
    const pending = await this.countPendingDeliveries(deliveryPersonId);
    if (pending === 0) {
      const person = await DeliveryPerson.findById(deliveryPersonId);
      if (person) {
        person.status = "free";
        await person.save();
      }
    }
  }
}
