export interface RestaurantReadModelItem {
  restaurantId: string;
  name: string;
  status: string;
  ownerId?: string;
}

export interface IRestaurantReadModelRepository {
  upsert(item: RestaurantReadModelItem): Promise<void>;
  findById(restaurantId: string): Promise<RestaurantReadModelItem | null>;
}
