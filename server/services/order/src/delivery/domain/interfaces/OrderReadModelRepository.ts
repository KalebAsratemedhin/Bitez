export interface OrderReadModelItem {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  deliveryAddress?: string;
  coordinates?: { lat?: number; lng?: number };
}

export interface IOrderReadModelRepository {
  upsert(item: Partial<OrderReadModelItem> & { orderId: string }): Promise<void>;
  findByOrderId(orderId: string): Promise<OrderReadModelItem | null>;
}
