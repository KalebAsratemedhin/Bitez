export class RestaurantUseCase {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async getById(restaurantId) {
        return this.deps.restaurantRepository.findById(restaurantId, []);
    }
    async getByOwnerId(input) {
        const { ownerId, page, limit } = input;
        const { restaurants, total } = await this.deps.restaurantRepository.findByOwnerId(ownerId, page, limit);
        const totalPages = Math.ceil(total / limit);
        return { restaurants, total, totalPages, currentPage: page };
    }
    async create(input) {
        const { ownerId, name, address, location, logo, latitude, longitude, deliveryAreaRadius } = input;
        if (!name?.trim())
            throw new Error("Name is required");
        const locationStr = typeof address === "string" ? address : JSON.stringify(location ?? {});
        const payload = {
            name: name.trim(),
            location: locationStr,
            ownerId,
            status: "active",
            logo: logo ?? "",
        };
        if (latitude !== undefined)
            payload.latitude = latitude;
        if (longitude !== undefined)
            payload.longitude = longitude;
        if (deliveryAreaRadius !== undefined)
            payload.deliveryAreaRadius = deliveryAreaRadius;
        const created = await this.deps.restaurantRepository.create(payload);
        const createdRest = created;
        const createdOwnerId = createdRest.ownerId != null && typeof createdRest.ownerId === "object" && "_id" in createdRest.ownerId
            ? String(createdRest.ownerId._id)
            : String(createdRest.ownerId ?? "");
        await this.deps.eventPublisher.publish("restaurant.created", {
            restaurantId: String(createdRest._id ?? ""),
            ownerId: createdOwnerId,
            name: createdRest.name ?? "",
        });
        return created;
    }
    async update(input) {
        const { restaurantId, ownerId, name, address, location, logo, latitude, longitude, deliveryAreaRadius } = input;
        const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
        if (!restaurant)
            throw new Error("Restaurant not found");
        const r = restaurant;
        const oid = r.ownerId && typeof r.ownerId === "object" && "_id" in r.ownerId
            ? r.ownerId._id
            : r.ownerId;
        if (String(oid) !== ownerId)
            throw new Error("Not the owner of this restaurant");
        const update = {};
        if (name !== undefined)
            update.name = name;
        if (address !== undefined)
            update.location = address;
        if (location !== undefined) {
            update.location = typeof location === "string" ? location : JSON.stringify(location);
        }
        if (logo !== undefined)
            update.logo = logo;
        if (latitude !== undefined)
            update.latitude = latitude;
        if (longitude !== undefined)
            update.longitude = longitude;
        if (deliveryAreaRadius !== undefined)
            update.deliveryAreaRadius = deliveryAreaRadius;
        const updated = await this.deps.restaurantRepository.findByIdAndUpdate(restaurantId, update);
        const updatedRest = updated;
        const updatedOwnerId = updatedRest.ownerId != null && typeof updatedRest.ownerId === "object" && "_id" in updatedRest.ownerId
            ? String(updatedRest.ownerId._id)
            : String(updatedRest.ownerId ?? "");
        await this.deps.eventPublisher.publish("restaurant.updated", {
            restaurantId: String(updatedRest._id ?? restaurantId),
            ownerId: updatedOwnerId,
            name: updatedRest.name ?? restaurant.name ?? "",
        });
        return updated;
    }
    async delete(restaurantId, ownerId) {
        const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
        if (!restaurant)
            throw new Error("Restaurant not found");
        const r = restaurant;
        const oid = r.ownerId && typeof r.ownerId === "object" && "_id" in r.ownerId
            ? r.ownerId._id
            : r.ownerId;
        if (String(oid) !== ownerId)
            throw new Error("Not the owner of this restaurant");
        return this.deps.restaurantRepository.findByIdAndDelete(restaurantId);
    }
    async getActive(input) {
        const { page, limit, search } = input;
        const { restaurants, total } = await this.deps.restaurantRepository.findActiveWithSearch(search?.trim() || undefined, page, limit);
        const totalPages = Math.ceil(total / limit);
        return { restaurants, total, totalPages, currentPage: page };
    }
    async getTopRestaurants(limit = 10) {
        const { restaurants } = await this.deps.restaurantRepository.findActive({}, 1, limit);
        return { restaurants };
    }
}
