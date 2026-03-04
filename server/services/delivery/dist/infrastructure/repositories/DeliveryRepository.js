import Delivery from "../persistence/models/delivery.js";
export class DeliveryRepository {
    async findById(id, populate = []) {
        let query = Delivery.findById(id);
        if (populate.includes("deliveryPersonId"))
            query = query.populate("deliveryPersonId");
        return query.lean();
    }
    async create(data) {
        const delivery = new Delivery(data);
        return delivery.save();
    }
    async findAllPaginated(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [deliveries, total] = await Promise.all([
            Delivery.find().populate("deliveryPersonId").skip(skip).limit(limit).lean(),
            Delivery.countDocuments(),
        ]);
        return { deliveries, total };
    }
    async findByDeliveryPersonId(deliveryPersonId, page = 1, limit = 10) {
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
    async findByCustomerId(customerId, page = 1, limit = 10) {
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
    async hasDeliveredToCustomer(deliveryPersonId, customerUserId) {
        const count = await Delivery.countDocuments({
            deliveryPersonId,
            status: "delivered",
            customerId: customerUserId,
        });
        return count > 0;
    }
    async updateStatus(deliveryId, status) {
        await Delivery.findByIdAndUpdate(deliveryId, { status });
    }
}
