function getUserId(req) {
    return req.user.id;
}
function toMenuItemResponse(it) {
    const item = it;
    return {
        _id: item._id != null ? String(item._id) : "",
        name: item.name ?? "",
        description: item.description ?? "",
        price: item.price ?? 0,
        quantity: 0,
        rating: 0,
        itemPicture: item.itemPicture ?? "",
    };
}
function toMenuResponse(m) {
    const x = m;
    return {
        _id: String(x._id ?? ""),
        menuName: x.menuName ?? "",
        restaurant: x.restaurant != null ? String(x.restaurant) : "",
        menuItems: (x.menuItems ?? []).map(toMenuItemResponse),
    };
}
export class MenuController {
    menuUseCase;
    cloudinary;
    constructor(menuUseCase, cloudinary) {
        this.menuUseCase = menuUseCase;
        this.cloudinary = cloudinary;
    }
    createMenu = async (req, res) => {
        try {
            const restaurantId = typeof req.params.restaurantId === "string"
                ? req.params.restaurantId
                : req.params.restaurantId?.[0] ?? "";
            const body = req.body;
            const menuName = body.menuName?.trim();
            if (!menuName) {
                res.status(400).json({ message: "Menu name is required" });
                return;
            }
            let items;
            try {
                items = JSON.parse(body.menuItems || "[]");
            }
            catch {
                res.status(400).json({ message: "Invalid menuItems JSON" });
                return;
            }
            if (!Array.isArray(items) || items.length === 0) {
                res.status(400).json({ message: "At least one menu item is required" });
                return;
            }
            const files = req.files ?? [];
            const itemPicturePaths = [];
            if (files.length > 0 && this.cloudinary) {
                for (const f of files) {
                    if (f.buffer) {
                        try {
                            const url = await this.cloudinary.uploadBuffer(f.buffer, "menus", { mimetype: f.mimetype });
                            itemPicturePaths.push(url);
                        }
                        catch {
                            itemPicturePaths.push("");
                        }
                    }
                    else
                        itemPicturePaths.push("");
                }
            }
            const menu = await this.menuUseCase.create({
                restaurantId,
                userId: getUserId(req),
                menuName,
                menuItems: items.map((item) => ({
                    name: item.name ?? "",
                    description: item.description ?? "",
                    price: Number(item.price) || 0,
                })),
                itemPicturePaths,
            });
            const created = menu;
            res.status(201).json({
                message: "Menu created successfully",
                data: {
                    _id: String(created._id ?? ""),
                    menuName: created.menuName ?? "",
                    restaurant: restaurantId,
                    menuItems: (created.menuItems ?? []).map(toMenuItemResponse),
                },
            });
        }
        catch (e) {
            const err = e;
            if (err.message?.includes("Not the owner"))
                res.status(403).json({ message: err.message });
            else
                res.status(500).json({ message: err.message });
        }
    };
    getMenuByRestaurant = async (req, res) => {
        try {
            const restaurantId = typeof req.params.restaurantId === "string"
                ? req.params.restaurantId
                : req.params.restaurantId?.[0] ?? "";
            const menus = await this.menuUseCase.getByRestaurantId({ restaurantId });
            const out = menus.map(toMenuResponse);
            res.json({ menus: out });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    getMenuById = async (req, res) => {
        try {
            const menuId = String(req.params.id ?? "").split(",")[0];
            const menu = await this.menuUseCase.getById({ menuId });
            if (!menu) {
                res.status(404).json({ message: "Menu not found" });
                return;
            }
            res.json(toMenuResponse(menu));
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    updateMenu = async (req, res) => {
        try {
            const menuId = typeof req.params.menuId === "string"
                ? req.params.menuId
                : req.params.menuId?.[0] ?? "";
            const body = req.body;
            const files = req.files ?? [];
            const itemPicturePaths = [];
            if (files.length > 0 && this.cloudinary) {
                for (const f of files) {
                    if (f.buffer) {
                        try {
                            const url = await this.cloudinary.uploadBuffer(f.buffer, "menus", { mimetype: f.mimetype });
                            itemPicturePaths.push(url);
                        }
                        catch {
                            itemPicturePaths.push("");
                        }
                    }
                    else
                        itemPicturePaths.push("");
                }
            }
            let newPictureIndices = [];
            try {
                if (body.newPictureIndices) {
                    newPictureIndices = JSON.parse(body.newPictureIndices);
                }
            }
            catch {
            }
            const update = {};
            if (body.menuName !== undefined)
                update.menuName = body.menuName.trim();
            if (body.menuItems !== undefined) {
                try {
                    const items = JSON.parse(body.menuItems);
                    update.menuItems = items.map((item, i) => {
                        const existingPicture = item.itemPicture ?? "";
                        const newFileIndex = newPictureIndices.indexOf(i);
                        const picture = newFileIndex >= 0 && itemPicturePaths[newFileIndex]
                            ? itemPicturePaths[newFileIndex]
                            : existingPicture;
                        return {
                            name: item.name ?? "",
                            description: item.description ?? "",
                            price: Number(item.price) || 0,
                            itemPicture: picture,
                        };
                    });
                }
                catch {
                    res.status(400).json({ message: "Invalid menuItems JSON" });
                    return;
                }
            }
            await this.menuUseCase.update({
                menuId,
                userId: getUserId(req),
                menuName: update.menuName,
                menuItems: update.menuItems,
                itemPicturePaths: itemPicturePaths.length ? itemPicturePaths : undefined,
            });
            res.json({ message: "Menu updated successfully" });
        }
        catch (e) {
            const err = e;
            if (err.message?.includes("Not the owner"))
                res.status(403).json({ message: err.message });
            else if (err.message?.includes("not found"))
                res.status(404).json({ message: err.message });
            else
                res.status(500).json({ message: err.message });
        }
    };
    deleteMenu = async (req, res) => {
        try {
            const menuId = typeof req.params.menuId === "string"
                ? req.params.menuId
                : req.params.menuId?.[0] ?? "";
            await this.menuUseCase.delete({ menuId, userId: getUserId(req) });
            res.json({ message: "Menu deleted successfully" });
        }
        catch (e) {
            const err = e;
            if (err.message?.includes("Not the owner"))
                res.status(403).json({ message: err.message });
            else if (err.message?.includes("not found"))
                res.status(404).json({ message: err.message });
            else
                res.status(500).json({ message: err.message });
        }
    };
}
