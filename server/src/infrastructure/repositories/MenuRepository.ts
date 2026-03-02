import Menu from "@models/Menu.js";
import mongoose from "mongoose";
import type { IMenuRepository, MenuItemInput } from "@domain/interfaces/MenuRepository.js";

export class MenuRepository implements IMenuRepository {
  async create(data: {
    menuName: string;
    restaurantId: string;
    menuItems: MenuItemInput[];
  }) {
    const doc = await Menu.create({
      menuName: data.menuName,
      restaurant: new mongoose.Types.ObjectId(data.restaurantId),
      menuItems: data.menuItems,
    });
    return doc;
  }

  async findById(id: string) {
    return Menu.findById(id).lean();
  }

  async findByRestaurantId(restaurantId: string) {
    return Menu.find({ restaurant: new mongoose.Types.ObjectId(restaurantId) }).lean();
  }

  async findByIdAndUpdate(
    id: string,
    update: { menuName?: string; menuItems?: MenuItemInput[] }
  ) {
    return Menu.findByIdAndUpdate(id, update, { new: true }).lean();
  }

  async findByIdAndDelete(id: string) {
    return Menu.findByIdAndDelete(id).lean();
  }
}
