import Menu from "../persistence/models/Menu.js";
import mongoose from "mongoose";
import type {
  IMenuRepository,
  MenuItemInput,
  CreateMenuData,
  UpdateMenuData,
  MenuItemWithRestaurant,
} from "@domain/interfaces/MenuRepository.js";
import type { Menu as MenuEntity, MenuItem } from "@domain/entities/Menu.js";

function toMenuItem(item: Record<string, unknown>): MenuItem {
  return {
    _id: String(item._id ?? ""),
    name: String(item.name ?? ""),
    description: String(item.description ?? ""),
    price: Number(item.price ?? 0),
    itemPicture: String(item.itemPicture ?? ""),
  };
}

function toMenu(doc: Record<string, unknown>): MenuEntity {
  const rawItems = Array.isArray(doc.menuItems) ? doc.menuItems : [];

  return {
    _id: String(doc._id ?? ""),
    menuName: String(doc.menuName ?? ""),
    restaurantId: String(doc.restaurantId ?? ""),
    menuItems: rawItems.map((i: Record<string, unknown>) => toMenuItem(i)),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : undefined,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : undefined,
  };
}

function toMenuItemWithRestaurant(row: Record<string, unknown>): MenuItemWithRestaurant {
  return {
    _id: String(row._id ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    itemPicture: String(row.itemPicture ?? ""),
    restaurantId: String(row.restaurantId ?? ""),
  };
}

export class MenuRepository implements IMenuRepository {
  async create(data: CreateMenuData): Promise<MenuEntity> {
    const doc = await Menu.create({
      menuName: data.menuName,
      restaurant: new mongoose.Types.ObjectId(data.restaurantId),
      menuItems: data.menuItems,
    });

    return toMenu(doc.toObject());
  }

  async findById(id: string): Promise<MenuEntity | null> {
    
    const doc = await Menu.findById(id).lean();
    if (!doc) return null;

    return toMenu(doc);
  }

  async findByRestaurantId(restaurantId: string): Promise<MenuEntity[]> {
    const docs = await Menu.find({
      restaurant: new mongoose.Types.ObjectId(restaurantId),
    }).lean();

    return (docs).map(toMenu);
  }

  async findByIdAndUpdate(
    id: string,
    update: UpdateMenuData,
  ): Promise<MenuEntity | null> {
    
    const doc = await Menu.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) return null;

    return toMenu(doc);
  }

  async findByIdAndDelete(id: string): Promise<MenuEntity | null> {
    const doc = await Menu.findByIdAndDelete(id).lean();
    if (!doc) return null;
    return toMenu(doc);
  }

  async findMenuItemsByIds(ids: string[]): Promise<MenuItemWithRestaurant[]> {
    
    if (ids.length === 0) return [];

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const result = await Menu.aggregate([
      { $unwind: "$menuItems" },
      { $match: { "menuItems._id": { $in: objectIds } } },
      {
        $project: {
          _id: "$menuItems._id",
          name: "$menuItems.name",
          description: "$menuItems.description",
          price: "$menuItems.price",
          itemPicture: "$menuItems.itemPicture",
          restaurantId: "$restaurant",
        },
      },
    ]).exec();
    return (result).map(toMenuItemWithRestaurant);
  }

  async findSomeMenuItems(limit: number): Promise<MenuItemWithRestaurant[]> {
    const result = await Menu.aggregate([
      { $unwind: "$menuItems" },
      {
        $project: {
          _id: "$menuItems._id",
          name: "$menuItems.name",
          description: "$menuItems.description",
          price: "$menuItems.price",
          itemPicture: "$menuItems.itemPicture",
          restaurantId: "$restaurant",
        },
      },
      { $limit: limit },
    ]).exec();

    return (result).map(toMenuItemWithRestaurant);
  }
}