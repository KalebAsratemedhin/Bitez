export interface UnassignedOrderRecord {
    orderId: string;
    customerId?: string;
    restaurantId?: string;
    estimatedDeliveryTime: Date;
    deliveryAddress?: string;
    coordinates?: { lat?: number; lng?: number };
}
  
export interface IUnassignedOrderRepository {
    add(data: UnassignedOrderRecord): Promise<void>;
    getOldest(): Promise<UnassignedOrderRecord | null>;
    /** Atomically remove and return the oldest queued order (single-worker safe). */
    claimOldest(): Promise<UnassignedOrderRecord | null>;
    removeByOrderId(orderId: string): Promise<void>;
}