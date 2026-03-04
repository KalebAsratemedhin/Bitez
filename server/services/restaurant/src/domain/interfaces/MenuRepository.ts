export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  itemPicture?: string;
}

export interface IMenuRepository {
  create(data: { menuName: string; restaurantId: string; menuItems: MenuItemInput[] }): Promise<unknown>;
  findById(id: string): Promise<unknown | null>;
  findByRestaurantId(restaurantId: string): Promise<unknown[]>;
  findByIdAndUpdate(
    id: string,
    update: { menuName?: string; menuItems?: MenuItemInput[] }
  ): Promise<unknown | null>;
  findByIdAndDelete(id: string): Promise<unknown | null>;
}
