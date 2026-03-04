function getUserId(req) {
    return req.user.id;
}
function toRestaurantResponse(r, ratingOverride) {
    const x = r;
    const loc = x.location;
    const hasCoords = typeof x.latitude === "number" && typeof x.longitude === "number";
    const coordinates = hasCoords ? [x.longitude, x.latitude] : [];
    const address = typeof loc === "string" ? loc : loc?.address ?? "";
    const locationNormalized = {
        type: "Point",
        coordinates,
        address,
    };
    return {
        _id: String(x._id ?? ""),
        name: x.name ?? "",
        location: locationNormalized,
        latitude: typeof x.latitude === "number" ? x.latitude : undefined,
        longitude: typeof x.longitude === "number" ? x.longitude : undefined,
        deliveryAreaRadius: typeof x.deliveryAreaRadius === "number" ? x.deliveryAreaRadius : 5000,
        logo: x.logo ?? "",
        status: x.status ?? "active",
        rating: ratingOverride !== undefined ? ratingOverride : 0,
        ownerId: x.ownerId,
    };
}
const ENTITY_TYPE_RESTAURANT = "restaurant";
export class RestaurantController {
    restaurantUseCase;
    ratingRepository;
    cloudinary;
    menuRepository;
    constructor(restaurantUseCase, ratingRepository, cloudinary, menuRepository) {
        this.restaurantUseCase = restaurantUseCase;
        this.ratingRepository = ratingRepository;
        this.cloudinary = cloudinary;
        this.menuRepository = menuRepository;
    }
    async getAverageRatingForRestaurant(restaurantId) {
        return this.ratingRepository
            ? await this.ratingRepository.getAverageRating(ENTITY_TYPE_RESTAURANT, restaurantId)
            : 0;
    }
    getMine = async (req, res) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const result = await this.restaurantUseCase.getByOwnerId({
                ownerId: getUserId(req),
                page,
                limit,
            });
            const data = await Promise.all(result.restaurants.map(async (r) => {
                const id = String(r._id ?? "");
                const rating = await this.getAverageRatingForRestaurant(id);
                return toRestaurantResponse(r, rating);
            }));
            res.json({
                message: "OK",
                data,
                totalCount: result.total,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
            });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    create = async (req, res) => {
        try {
            const userId = getUserId(req);
            const body = req.body;
            const file = req.file;
            let logo = body.logo ?? "";
            if (file?.buffer && this.cloudinary) {
                try {
                    logo = await this.cloudinary.uploadBuffer(file.buffer, "restaurants", { mimetype: file.mimetype });
                }
                catch {
                    // keep body.logo or ""
                }
            }
            await this.restaurantUseCase.create({
                ownerId: userId,
                name: body.name ?? "",
                address: body.address,
                location: body.location,
                logo,
                latitude: body.latitude != null ? Number(body.latitude) : undefined,
                longitude: body.longitude != null ? Number(body.longitude) : undefined,
                deliveryAreaRadius: body.deliveryAreaRadius != null
                    ? Number(body.deliveryAreaRadius)
                    : undefined,
            });
            res.status(201).json({ message: "Restaurant created successfully" });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    update = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const body = req.body;
            const file = req.file;
            let logo;
            if (file?.buffer && this.cloudinary) {
                try {
                    logo = await this.cloudinary.uploadBuffer(file.buffer, "restaurants", { mimetype: file.mimetype });
                }
                catch {
                    // leave undefined to keep existing
                }
            }
            await this.restaurantUseCase.update({
                restaurantId: id,
                ownerId: getUserId(req),
                name: body.name,
                address: body.address,
                location: body.location,
                logo,
                latitude: body.latitude != null && body.latitude !== ""
                    ? Number(body.latitude)
                    : undefined,
                longitude: body.longitude != null && body.longitude !== ""
                    ? Number(body.longitude)
                    : undefined,
                deliveryAreaRadius: body.deliveryAreaRadius != null && body.deliveryAreaRadius !== ""
                    ? Number(body.deliveryAreaRadius)
                    : undefined,
            });
            res.json({ message: "Restaurant updated successfully" });
        }
        catch (e) {
            const err = e;
            if (err.message?.includes("Not the owner"))
                res.status(403).json({ error: err.message });
            else if (err.message?.includes("not found"))
                res.status(404).json({ error: err.message });
            else
                res.status(500).json({ error: err.message });
        }
    };
    delete = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            await this.restaurantUseCase.delete(id, getUserId(req));
            res.json({ message: "Restaurant deleted successfully" });
        }
        catch (e) {
            const err = e;
            if (err.message?.includes("Not the owner"))
                res.status(403).json({ error: err.message });
            else if (err.message?.includes("not found"))
                res.status(404).json({ error: err.message });
            else
                res.status(500).json({ error: err.message });
        }
    };
    getActive = async (req, res) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
            const result = await this.restaurantUseCase.getActive({ page, limit, search });
            const data = await Promise.all(result.restaurants.map(async (r) => {
                const id = String(r._id ?? "");
                const rating = await this.getAverageRatingForRestaurant(id);
                return toRestaurantResponse(r, rating);
            }));
            res.json({
                message: "OK",
                data,
                totalCount: result.total,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
            });
        }
        catch (e) {
            const err = e;
            console.error("[RestaurantController.getActive]", err);
            res.status(500).json({ error: err.message || "Internal server error" });
        }
    };
    getById = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const restaurant = await this.restaurantUseCase.getById(id);
            if (!restaurant) {
                res.status(404).json({ error: "Restaurant not found" });
                return;
            }
            const rating = await this.getAverageRatingForRestaurant(id);
            res.json({ message: "OK", data: toRestaurantResponse(restaurant, rating) });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    getTopRestaurants = async (_req, res) => {
        try {
            const result = await this.restaurantUseCase.getTopRestaurants(50);
            const withRatings = await Promise.all(result.restaurants.map(async (r) => {
                const rid = String(r._id ?? "");
                let rating = 0;
                try {
                    rating = await this.getAverageRatingForRestaurant(rid);
                }
                catch {
                    // ignore rating lookup errors
                }
                return { r, rid, rating };
            }));
            withRatings.sort((a, b) => b.rating - a.rating);
            const top = withRatings.slice(0, 10);
            const data = top.map(({ r, rating }) => toRestaurantResponse(r, rating));
            res.json(data);
        }
        catch (e) {
            const err = e;
            console.error("[RestaurantController.getTopRestaurants]", err);
            res.status(500).json({ error: err.message || "Internal server error" });
        }
    };
    getTopMenuItems = async (_req, res) => {
        try {
            if (!this.ratingRepository || !this.menuRepository) {
                res.json([]);
                return;
            }
            const topRated = await this.ratingRepository.getTopRatedEntityIds("menu_item", 10);
            let items;
            const ratingMap = new Map();
            if (topRated.length > 0) {
                const ids = topRated.map((x) => x.entityId);
                topRated.forEach((x) => ratingMap.set(x.entityId, x.avg));
                items = await this.menuRepository.findMenuItemsByIds(ids);
                // Preserve order by top-rated
                const idOrder = ids;
                items = idOrder
                    .map((id) => items.find((i) => String(i._id) === id))
                    .filter(Boolean);
            }
            else {
                // No ratings yet: show featured dishes so landing page is never empty
                items = await this.menuRepository.findSomeMenuItems(10);
            }
            const ordered = items.map((item) => {
                const id = String(item._id);
                const rid = String(item.restaurantId ?? "");
                return {
                    _id: id,
                    name: item.name ?? "",
                    description: item.description ?? "",
                    price: item.price ?? 0,
                    itemPicture: item.itemPicture ?? "",
                    rating: Math.round((ratingMap.get(id) ?? 0) * 10) / 10,
                    restaurantId: rid,
                    restaurant: null,
                };
            });
            const restaurantIds = [...new Set(ordered.map((o) => o.restaurantId).filter(Boolean))];
            const restaurantMap = new Map();
            await Promise.all(restaurantIds.map(async (rid) => {
                const r = await this.restaurantUseCase.getById(rid);
                if (r && typeof r === "object" && "name" in r)
                    restaurantMap.set(rid, { _id: rid, name: String(r.name ?? "") });
            }));
            ordered.forEach((o) => {
                o.restaurant = restaurantMap.get(o.restaurantId) ?? { _id: o.restaurantId, name: "" };
            });
            res.json(ordered);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
}
