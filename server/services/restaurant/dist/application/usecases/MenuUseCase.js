function getOwnerId(restaurant) {
    const r = restaurant;
    const o = r.ownerId;
    if (o && typeof o === "object" && "_id" in o)
        return String(o._id);
    if (o != null)
        return String(o);
    return null;
}
export class MenuUseCase {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async assertRestaurantOwner(restaurantId, userId) {
        const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
        if (!restaurant)
            throw new Error("Restaurant not found");
        const ownerId = getOwnerId(restaurant);
        if (ownerId !== userId)
            throw new Error("Not the owner of this restaurant");
    }
    async create(input) {
        const { restaurantId, userId, menuName, menuItems, itemPicturePaths } = input;
        if (!menuName?.trim())
            throw new Error("Menu name is required");
        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            throw new Error("At least one menu item is required");
        }
        await this.assertRestaurantOwner(restaurantId, userId);
        const paths = itemPicturePaths ?? [];
        const items = menuItems.map((item, i) => ({
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
    async getByRestaurantId(input) {
        return this.deps.menuRepository.findByRestaurantId(input.restaurantId);
    }
    async getById(input) {
        return this.deps.menuRepository.findById(input.menuId);
    }
    async update(input) {
        const { menuId, userId, menuName, menuItems, itemPicturePaths } = input;
        const menu = await this.deps.menuRepository.findById(menuId);
        if (!menu)
            throw new Error("Menu not found");
        const m = menu;
        const restaurantId = m.restaurant && typeof m.restaurant === "object" && "_id" in m.restaurant
            ? String(m.restaurant._id)
            : String(m.restaurant);
        await this.assertRestaurantOwner(restaurantId, userId);
        const update = {};
        if (menuName !== undefined)
            update.menuName = menuName.trim();
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
    async delete(input) {
        const { menuId, userId } = input;
        const menu = await this.deps.menuRepository.findById(menuId);
        if (!menu)
            throw new Error("Menu not found");
        const m = menu;
        const restaurantId = m.restaurant && typeof m.restaurant === "object" && "_id" in m.restaurant
            ? String(m.restaurant._id)
            : String(m.restaurant);
        await this.assertRestaurantOwner(restaurantId, userId);
        return this.deps.menuRepository.findByIdAndDelete(menuId);
    }
}
