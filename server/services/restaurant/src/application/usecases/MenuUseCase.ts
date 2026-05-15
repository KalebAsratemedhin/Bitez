import type {
  IMenuRepository,
  MenuItemInput,
  CreateMenuData,
  UpdateMenuData,
} from "@domain/interfaces/MenuRepository.js";
import type { IRestaurantRepository } from "@domain/interfaces/index.js";
import type { Restaurant } from "@domain/entities/Restaurant.js";
import type { Menu } from "@domain/entities/Menu.js";
import type {
  CreateMenuInput,
  UpdateMenuInput,
  GetMenuByRestaurantInput,
  GetMenuByIdInput,
  DeleteMenuInput,
} from "@application/dto/menu.dto.js";

export interface MenuUseCaseDeps {
  menuRepository: IMenuRepository;
  restaurantRepository: IRestaurantRepository;
}

function ownerIdString(restaurant: Restaurant): string {
  const owner = restaurant.ownerId as unknown;
  if (typeof owner === "string") return owner;
  if (owner && typeof owner === "object" && "_id" in owner) {
    const id = (owner as { _id?: unknown })._id;
    if (id != null) return String(id);
  }
  return "";
}

export class MenuUseCase {
  constructor(private readonly deps: MenuUseCaseDeps) {}

  private async assertRestaurantOwner(restaurantId: string, userId: string): Promise<void> {
    if (!restaurantId?.trim()) throw new Error("Restaurant not found");
    if (!userId?.trim()) throw new Error("Authentication required");
    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
    
    if (!restaurant) throw new Error("Restaurant not found");
    const ownerId = ownerIdString(restaurant);
    if (!ownerId) throw new Error("Restaurant owner is not set");
    if (ownerId !== userId) {
      throw new Error("Not the owner of this restaurant");
    }
  }

  async create(input: CreateMenuInput): Promise<Menu> {
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

    const data: CreateMenuData = {
      menuName: menuName.trim(),
      restaurantId,
      menuItems: items,
    };

    return this.deps.menuRepository.create(data);
  }

  async getByRestaurantId(input: GetMenuByRestaurantInput): Promise<Menu[]> {
    return this.deps.menuRepository.findByRestaurantId(input.restaurantId);
  }

  async getById(input: GetMenuByIdInput): Promise<Menu | null> {
    return this.deps.menuRepository.findById(input.menuId);
  }

  async update(input: UpdateMenuInput): Promise<Menu | null> {
    const { menuId, userId, menuName, menuItems } = input;
    const menu = await this.deps.menuRepository.findById(menuId);

    if (!menu) throw new Error("Menu not found");

    await this.assertRestaurantOwner(menu.restaurantId, userId);

    const update: UpdateMenuData = {};
    if (menuName !== undefined) update.menuName = menuName.trim();
    if (menuItems !== undefined) {
      update.menuItems = menuItems.map((item) => ({
        name: item.name ?? "",
        description: item.description ?? "",
        price: Number(item.price) || 0,
        itemPicture: item.itemPicture ?? "",
      }));
    }

    return this.deps.menuRepository.findByIdAndUpdate(menuId, update);
  }

  async delete(input: DeleteMenuInput): Promise<Menu | null> {
    const { menuId, userId } = input;
    const menu = await this.deps.menuRepository.findById(menuId);

    if (!menu) throw new Error("Menu not found");

    await this.assertRestaurantOwner(menu.restaurantId, userId);
    
    return this.deps.menuRepository.findByIdAndDelete(menuId);
  }
}