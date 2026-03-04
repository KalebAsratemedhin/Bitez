export interface IDeliveryAssignmentService {
  assignDelivery(
    orderId: string,
    estimatedDeliveryTime: Date,
    customerId?: string,
  ): Promise<void>;
}
