import type { MenuItemInput } from "../../domain/interfaces/MenuRepository.js";

export interface CreateMenuInput {
  restaurantId: string;
  userId: string;
  menuName: string;
  menuItems: MenuItemInput[];
  itemPicturePaths?: string[];
}

export interface UpdateMenuInput {
  menuId: string;
  userId: string;
  menuName?: string;
  menuItems?: MenuItemInput[];
  itemPicturePaths?: string[];
}

export interface GetMenuByRestaurantInput {
  restaurantId: string;
}

export interface GetMenuByIdInput {
  menuId: string;
}

export interface DeleteMenuInput {
  menuId: string;
  userId: string;
}
