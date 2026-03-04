export class DeliveryUseCase {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async createDeliveryPerson(input) {
        return this.deps.deliveryPersonRepository.create({ userId: input.userId });
    }
    async hasDeliveredToCustomer(deliveryPersonId, customerUserId) {
        return this.deps.deliveryRepository.hasDeliveredToCustomer(deliveryPersonId, customerUserId);
    }
    async getDeliveryPersonByUserId(userId) {
        return this.deps.deliveryPersonRepository.findByUserId(userId);
    }
    async assignDelivery(input) {
        const { orderId, estimatedDeliveryTime, customerId } = input;
        const dpId = await this.deps.deliveryPersonRepository.findAvailableDeliveryPersonId();
        if (!dpId)
            throw new Error("No delivery person available at the moment.");
        const delivery = await this.deps.deliveryRepository.create({
            orderId,
            deliveryPersonId: dpId,
            status: "assigned",
            estimatedDeliveryTime,
            ...(customerId && { customerId }),
        });
        await this.deps.deliveryPersonRepository.setPersonBusy(dpId);
        const dp = await this.deps.deliveryPersonRepository.findById(dpId);
        const deliveryPersonUserId = (dp != null && typeof dp === "object" && "userId" in dp)
            ? String(dp.userId ?? "")
            : "";
        const d = delivery;
        if (deliveryPersonUserId) {
            await this.deps.eventPublisher.publish("delivery.created", {
                deliveryId: String(d._id ?? ""),
                orderId: String(d.orderId ?? orderId),
                deliveryPersonUserId,
                status: "assigned",
                createdAt: d.createdAt ?? new Date(),
            });
        }
        return { delivery };
    }
    async updateDeliveryStatus(input) {
        const { deliveryId, status, userId } = input;
        const delivery = await this.deps.deliveryRepository.findById(deliveryId, [
            "deliveryPersonId",
            "orderId",
        ]);
        if (!delivery)
            throw new Error("Delivery not found.");
        const d = delivery;
        const dp = d.deliveryPersonId;
        const dpUserId = (dp?.userId && typeof dp.userId === "object" && "_id" in dp.userId
            ? dp.userId._id
            : dp?.userId) ?? dp?.userId;
        if (!dpUserId || String(dpUserId) !== userId) {
            throw new Error("You are not authorized to update this delivery.");
        }
        await this.deps.deliveryRepository.updateStatus(deliveryId, status);
        const orderIdVal = delivery.orderId;
        const orderIdStr = orderIdVal != null && typeof orderIdVal === "object" && "_id" in orderIdVal
            ? String(orderIdVal._id)
            : String(orderIdVal ?? "");
        const createdAt = delivery.createdAt ?? new Date();
        await this.deps.eventPublisher.publish("delivery.updated", {
            deliveryId,
            orderId: orderIdStr,
            deliveryPersonUserId: String(dpUserId),
            status,
            createdAt,
        });
        if (d.customerId) {
            await this.deps.notificationService.sendToUser(String(d.customerId), `Your delivery is ${status}`);
        }
        if (status === "delivered" || status === "failed") {
            const dpId = d.deliveryPersonId?._id ?? d.deliveryPersonId;
            if (dpId) {
                await this.deps.deliveryPersonRepository.setPersonFreeIfNoPending(String(dpId));
            }
        }
        return this.deps.deliveryRepository.findById(deliveryId, [
            "deliveryPersonId",
            "orderId",
        ]);
    }
    async getAllDeliveries(page = 1, limit = 10) {
        return this.deps.deliveryRepository.findAllPaginated(page, limit);
    }
    async getDeliveriesByCustomerId(customerId, page = 1, limit = 10) {
        const { deliveries, total } = await this.deps.deliveryRepository.findByCustomerId(customerId, page, limit);
        if (!this.deps.getUserById || deliveries.length === 0) {
            return { deliveries, total };
        }
        const enriched = await Promise.all(deliveries.map(async (d) => {
            const doc = d;
            const dp = doc.deliveryPersonId;
            if (!dp || typeof dp !== "object" || !("userId" in dp))
                return d;
            const userIdVal = dp.userId;
            const userIdStr = userIdVal != null && typeof userIdVal === "object" && "_id" in userIdVal
                ? String(userIdVal._id)
                : String(userIdVal ?? "");
            const user = userIdStr ? await this.deps.getUserById(userIdStr) : null;
            if (!user)
                return d;
            return {
                ...doc,
                deliveryPersonId: { ...dp, userId: { _id: user._id, name: user.name, phoneNumber: user.phoneNumber } },
            };
        }));
        return { deliveries: enriched, total };
    }
    async getDeliveriesByDeliveryPersonUserId(userId, page = 1, limit = 10) {
        let person = await this.deps.deliveryPersonRepository.findByUserId(userId);
        if (!person) {
            try {
                person = await this.deps.deliveryPersonRepository.create({ userId });
            }
            catch {
                return { deliveries: [], total: 0 };
            }
        }
        const p = person;
        const { deliveries, total } = await this.deps.deliveryRepository.findByDeliveryPersonId(String(p._id), page, limit);
        let deliveryPerson;
        if (this.deps.getUserById) {
            const user = await this.deps.getUserById(userId);
            if (user) {
                deliveryPerson = { name: user.name, phoneNumber: user.phoneNumber };
            }
        }
        if (!this.deps.getOrderByIdEnriched || deliveries.length === 0) {
            return { deliveries, total, deliveryPerson };
        }
        const enriched = await Promise.all(deliveries.map(async (d) => {
            const doc = d;
            const orderIdVal = doc.orderId;
            const orderIdStr = orderIdVal != null && typeof orderIdVal === "object" && "_id" in orderIdVal
                ? String(orderIdVal._id)
                : String(orderIdVal ?? "");
            const order = orderIdStr ? await this.deps.getOrderByIdEnriched(orderIdStr) : null;
            return { ...doc, orderId: order ?? orderIdVal };
        }));
        return { deliveries: enriched, total, deliveryPerson };
    }
    async getDeliveryPersonDashboard(userId) {
        const { deliveries, total } = await this.getDeliveriesByDeliveryPersonUserId(userId, 1, 2000);
        const statusToDisplay = {
            delivered: "Completed",
            failed: "Cancelled",
            cancelled: "Cancelled",
        };
        const displayCounts = { Completed: 0, Cancelled: 0, "In Progress": 0 };
        deliveries.forEach((d) => {
            const s = d.status ?? "";
            const name = statusToDisplay[s.toLowerCase()] ?? "In Progress";
            displayCounts[name] = (displayCounts[name] ?? 0) + 1;
        });
        const deliveryData = [
            { name: "Completed", value: displayCounts.Completed },
            { name: "Cancelled", value: displayCounts.Cancelled },
            { name: "In Progress", value: displayCounts["In Progress"] },
        ];
        const recentDeliveries = deliveries.slice(0, 10).map((d) => {
            const x = d;
            const orderLabel = x.orderId != null ? String(x.orderId) : "";
            return {
                id: String(x._id ?? ""),
                order: orderLabel,
                status: statusToDisplay[(x.status ?? "").toLowerCase()] ?? x.status ?? "In Progress",
                time: x.createdAt ? new Date(x.createdAt).toISOString() : "",
            };
        });
        return {
            totalDeliveries: total,
            deliveryData,
            recentDeliveries,
        };
    }
}
