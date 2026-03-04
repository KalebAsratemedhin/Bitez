export interface IDashboardReadModels {
  findOrdersByCustomerId(customerId: string): Promise<unknown[]>;
  findRestaurantsByOwnerId(ownerId: string): Promise<unknown[]>;
  findOrdersByRestaurantIds(restaurantIds: string[]): Promise<unknown[]>;
  findDeliveriesByDeliveryPersonUserId(deliveryPersonUserId: string): Promise<unknown[]>;
  getRestaurantNamesByIds(restaurantIds: string[]): Promise<Map<string, string>>;
}
