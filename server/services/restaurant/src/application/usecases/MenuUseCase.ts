import type { IMenuRepository, MenuItemInput } from "../../domain/interfaces/MenuRepository.js";
import type { IRestaurantRepository } from "../../domain/interfaces/index.js";
import type {
  CreateMenuInput,
  UpdateMenuInput,
  GetMenuByRestaurantInput,
  GetMenuByIdInput,
  DeleteMenuInput,
} from "../dto/menu.dto.js";

export interface MenuUseCaseDeps {
  menuRepository: IMenuRepository;
  restaurantRepository: IRestaurantRepository;
}

function getOwnerId(restaurant: unknown): string | null {
  const r = restaurant as { ownerId?: { _id?: unknown } | unknown };
  const o = r.ownerId;
  if (o && typeof o === "object" && "_id" in o) return String((o as { _id: unknown })._id);
  if (o != null) return String(o);
  return null;
}

export class MenuUseCase {
  constructor(private readonly deps: MenuUseCaseDeps) {}

  private async assertRestaurantOwner(restaurantId: string, userId: string): Promise<void> {
    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new Error("Restaurant not found");
    const ownerId = getOwnerId(restaurant);
    if (ownerId !== userId) throw new Error("Not the owner of this restaurant");
  }

  async create(input: CreateMenuInput): Promise<unknown> {
    const { restaurantId, userId, menuName, menuItems, itemPicturePaths } = input;
    if (!menuName?.trim()) throw new Error("Menu name is required");
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      throw new Error("At least one menu item is required");
    }
    await this.assertRestaurantOwner(restaurantId, userId);
    const paths = itemPicturePaths ?? [];
    const items: MenuItemInput[] = menuItems.map((item, i) => ({
      name: item.name ?? "",
      description: item.description ?? "",
      price: Number(item.price) || 0,
      itemPicture: paths[i] ?? item.itemPicture ?? "",
    }));
    return this.deps.menuRepository.create({
      menuName: menuName.trim(),
      restaurantId,
      menuItems: items,
    });
  }

  async getByRestaurantId(input: GetMenuByRestaurantInput): Promise<unknown[]> {
    return this.deps.menuRepository.findByRestaurantId(input.restaurantId);
  }

  async getById(input: GetMenuByIdInput): Promise<unknown | null> {
    return this.deps.menuRepository.findById(input.menuId);
  }

  async update(input: UpdateMenuInput): Promise<unknown> {
    const { menuId, userId, menuName, menuItems, itemPicturePaths } = input;
    const menu = await this.deps.menuRepository.findById(menuId);
    if (!menu) throw new Error("Menu not found");
    const m = menu as { restaurant?: unknown };
    const restaurantId = m.restaurant && typeof m.restaurant === "object" && "_id" in m.restaurant
      ? String((m.restaurant as { _id: unknown })._id)
      : String(m.restaurant);
    await this.assertRestaurantOwner(restaurantId, userId);
    const update: { menuName?: string; menuItems?: MenuItemInput[] } = {};
    if (menuName !== undefined) update.menuName = menuName.trim();
    if (menuItems !== undefined) {
      update.menuItems = menuItems.map((item) => ({
        name: item.name ?? "",
        description: item.description ?? "",
        price: Number(item.price) || 0,
        itemPicture: item.itemPicture ?? "",
      }));
    }
    return this.deps.menuRepository.findByIdAndUpdate(menuId, update) as Promise<unknown>;
  }

  async delete(input: DeleteMenuInput): Promise<unknown> {
    const { menuId, userId } = input;
    const menu = await this.deps.menuRepository.findById(menuId);
    if (!menu) throw new Error("Menu not found");
    const m = menu as { restaurant?: unknown };
    const restaurantId = m.restaurant && typeof m.restaurant === "object" && "_id" in m.restaurant
      ? String((m.restaurant as { _id: unknown })._id)
      : String(m.restaurant);
    await this.assertRestaurantOwner(restaurantId, userId);
    return this.deps.menuRepository.findByIdAndDelete(menuId) as Promise<unknown>;
  }
}
