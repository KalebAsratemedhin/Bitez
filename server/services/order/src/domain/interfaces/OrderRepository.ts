export interface OrderCreateInput {
  customerID: string;
  restaurantID: string;
  orderDetails: Array<{ item: unknown; quantity: number }>;
  totalAmount?: number;
  deliveryAddress: string;
  coordinates: { lat: number; lng: number };
  status: string;
  paymentCompleted: boolean;
}

export interface PaginatedOrders {
  orders: unknown[];
  total: number;
}

export interface IOrderRepository {
  create(data: OrderCreateInput): Promise<unknown>;
  findById(id: string): Promise<unknown | null>;
  find(filter: object, page: number, limit: number): Promise<PaginatedOrders>;
  findByCustomerId(customerId: string, page: number, limit: number): Promise<PaginatedOrders>;
  findOrdersByCustomerId(customerId: string): Promise<unknown[]>;
  findByRestaurantId(restaurantId: string, page: number, limit: number): Promise<PaginatedOrders>;
  findOrdersByRestaurantIds(restaurantIds: string[]): Promise<unknown[]>;
  updateStatus(orderId: string, status: string): Promise<unknown | null>;
  updatePaymentCompleted?(orderId: string, paymentCompleted: boolean): Promise<unknown | null>;
}
