export interface OrderItemInput {
  item: unknown;
  quantity: number;
}

export interface CreateOrderInput {
  customerID: string;
  restaurantID: string;
  orderDetails: OrderItemInput[];
  totalAmount?: number;
  deliveryAddress: string;
  coordinates: { lat: number; lng: number };
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  userId: string;
}

export interface CancelOrderInput {
  orderId: string;
  userId: string;
}

export interface GetOrdersResult {
  orders: unknown[];
  total: number;
}

export interface InitializePaymentInput {
  orderId: string;
  total: number;
  userId: string;
  serverUrl: string;
}

export interface InitializePaymentResult {
  checkoutUrl?: string;
  message?: string;
}

export interface PaymentSuccessInput {
  token: string;
}

export interface PaymentSuccessResult {
  orderId: string;
}
