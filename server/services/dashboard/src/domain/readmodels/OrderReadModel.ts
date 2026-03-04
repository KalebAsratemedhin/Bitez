export interface IOrderReadModel {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}
