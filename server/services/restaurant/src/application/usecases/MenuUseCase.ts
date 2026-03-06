import type {
  IMenuRepository,
  MenuItemInput,
  CreateMenuData,
  UpdateMenuData,
} from "@domain/interfaces/MenuRepository.ts";
import type { IRestaurantRepository } from "@domain/interfaces/index.ts";
import type { Restaurant } from "@domain/entities/Restaurant.ts";
import type { Menu } from "@domain/entities/Menu.ts";
import type {
  CreateMenuInput,
  UpdateMenuInput,
  GetMenuByRestaurantInput,
  GetMenuByIdInput,
  DeleteMenuInput,
} from "@application/dto/menu.dto.ts";

export interface MenuUseCaseDeps {
  menuRepository: IMenuRepository;
  restaurantRepository: IRestaurantRepository;
}

function ownerIdString(restaurant: Restaurant): string {
  return typeof restaurant.ownerId === "string"
    ? restaurant.ownerId
    : restaurant.ownerId._id;
}

export class MenuUseCase {
  constructor(private readonly deps: MenuUseCaseDeps) {}

  private async assertRestaurantOwner(restaurantId: string, userId: string): Promise<void> {
    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
    
    if (!restaurant) throw new Error("Restaurant not found");
    if (ownerIdString(restaurant) !== userId) {
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