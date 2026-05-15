import type { Menu, MenuItem } from "@domain/entities/Menu.js";

export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  itemPicture?: string;
}

export interface CreateMenuData {
  menuName: string;
  restaurantId: string;
  menuItems: MenuItemInput[];
}

export interface UpdateMenuData {
  menuName?: string;
  menuItems?: MenuItemInput[];
}

export interface MenuItemWithRestaurant {
  _id: string;
  name: string;
  description: string;
  price: number;
  itemPicture: string;
  restaurantId: string;
}

export interface IMenuRepository {
  create(data: CreateMenuData): Promise<Menu>;
  findById(id: string): Promise<Menu | null>;
  findByRestaurantId(restaurantId: string): Promise<Menu[]>;
  findByIdAndUpdate(id: string, update: UpdateMenuData): Promise<Menu | null>;
  findByIdAndDelete(id: string): Promise<Menu | null>;
  findMenuItemsByIds(ids: string[]): Promise<MenuItemWithRestaurant[]>;
  findSomeMenuItems(limit: number): Promise<MenuItemWithRestaurant[]>;
}