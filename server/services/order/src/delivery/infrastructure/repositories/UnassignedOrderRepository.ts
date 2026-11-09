import type {
    IUnassignedOrderRepository,
    UnassignedOrderRecord,
} from "../../domain/interfaces/UnassignedOrderRepository.js";
import UnassignedOrder from "../persistence/models/unassignedOrder.js";

export class UnassignedOrderRepository implements IUnassignedOrderRepository {
    async add(data: UnassignedOrderRecord): Promise<void> {
        await UnassignedOrder.findOneAndUpdate(
            { orderId: data.orderId },
            {
                orderId: data.orderId,
                customerId: data.customerId,
                restaurantId: data.restaurantId,
                estimatedDeliveryTime: data.estimatedDeliveryTime,
                deliveryAddress: data.deliveryAddress,
                coordinates: data.coordinates,
            },
            { upsert: true }
        );
    }

    async getOldest(): Promise<UnassignedOrderRecord | null> {
        const doc = await UnassignedOrder.findOne().sort({ createdAt: 1 }).lean();
        if (!doc) return null;
        
        const d = doc as {
            orderId: string;
            customerId?: string;
            restaurantId?: string;
            estimatedDeliveryTime: Date;
            deliveryAddress?: string;
            coordinates?: { lat?: number; lng?: number };
        };

        return {
            orderId: d.orderId,
            customerId: d.customerId,
            restaurantId: d.restaurantId,
            estimatedDeliveryTime: d.estimatedDeliveryTime,
            deliveryAddress: d.deliveryAddress,
            coordinates: d.coordinates,
        };
    }

    async claimOldest(): Promise<UnassignedOrderRecord | null> {
        const doc = await UnassignedOrder.findOneAndDelete(
            {},
            { sort: { createdAt: 1 } },
        )
            .lean()
            .exec();
        if (!doc) return null;
        const d = doc as {
            orderId: string;
            customerId?: string;
            restaurantId?: string;
            estimatedDeliveryTime: Date;
            deliveryAddress?: string;
            coordinates?: { lat?: number; lng?: number };
        };
        return {
            orderId: d.orderId,
            customerId: d.customerId,
            restaurantId: d.restaurantId,
            estimatedDeliveryTime: d.estimatedDeliveryTime,
            deliveryAddress: d.deliveryAddress,
            coordinates: d.coordinates,
        };
    }

    async removeByOrderId(orderId: string): Promise<void> {
        await UnassignedOrder.deleteOne({ orderId });
    }
}