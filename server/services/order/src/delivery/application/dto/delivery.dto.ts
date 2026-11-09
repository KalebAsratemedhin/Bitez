export interface UpdateDeliveryStatusInput {
  deliveryId: string;
  status: string;
  userId: string;
}

export interface DeliveryPersonInfo {
  name: string;
  phoneNumber?: string;
}

export interface GetDeliveriesResult {
  deliveries: unknown[];
  total: number;
  /** When fetching by delivery person user id, the logged-in delivery person's info. */
  deliveryPerson?: DeliveryPersonInfo;
}

export interface AssignDeliveryInput {
  orderId: string;
  estimatedDeliveryTime: Date;
  customerId?: string;
}

export interface AssignDeliveryResult {
  delivery: unknown;
}

export interface CreateDeliveryPersonInput {
  userId: string;
}
