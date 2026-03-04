import Menu from "../persistence/models/Menu.js";
import mongoose from "mongoose";
export class MenuRepository {
    async create(data) {
        const doc = await Menu.create({
            menuName: data.menuName,
            restaurant: new mongoose.Types.ObjectId(data.restaurantId),
            menuItems: data.menuItems,
        });
        return doc;
    }
    async findById(id) {
        return Menu.findById(id).lean();
    }
    async findByRestaurantId(restaurantId) {
        return Menu.find({ restaurant: new mongoose.Types.ObjectId(restaurantId) }).lean();
    }
    async findByIdAndUpdate(id, update) {
        return Menu.findByIdAndUpdate(id, update, { new: true }).lean();
    }
    async findByIdAndDelete(id) {
        return Menu.findByIdAndDelete(id).lean();
    }
    async findMenuItemsByIds(ids) {
        if (ids.length === 0)
            return [];
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
        return result;
    }
    /** Return up to `limit` menu items from any menus (for fallback when no ratings exist). */
    async findSomeMenuItems(limit) {
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
        return result;
    }
}
