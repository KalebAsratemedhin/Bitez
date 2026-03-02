export interface UpdateDeliveryStatusInput {
  deliveryId: string;
  status: string;
  userId: string;
}

export interface GetDeliveriesResult {
  deliveries: unknown[];
  total: number;
}
