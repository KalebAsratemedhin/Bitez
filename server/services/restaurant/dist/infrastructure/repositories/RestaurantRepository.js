import Restaurant from "../persistence/models/Restaurant.js";
export class RestaurantRepository {
    async create(data) {
        const doc = new Restaurant(data);
        return doc.save();
    }
    async findById(id, populate = []) {
        let query = Restaurant.findById(id);
        if (populate.includes("ownerId"))
            query = query.populate("ownerId", "name email phoneNumber");
        if (populate.includes("menu"))
            query = query.populate("menu");
        return query.lean();
    }
    async findByOwnerId(ownerId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [restaurants, total] = await Promise.all([
            Restaurant.find({ ownerId }).skip(skip).limit(limit).lean(),
            Restaurant.countDocuments({ ownerId }),
        ]);
        return { restaurants, total };
    }
    async findActive(filter = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filterWithStatus = { status: "active", ...filter };
        const [restaurants, total] = await Promise.all([
            Restaurant.find(filterWithStatus).skip(skip).limit(limit).lean(),
            Restaurant.countDocuments(filterWithStatus),
        ]);
        return { restaurants, total };
    }
    async findActiveWithSearch(search, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filter = { status: "active" };
        if (search)
            filter.name = { $regex: search, $options: "i" };
        const [restaurants, total] = await Promise.all([
            Restaurant.find(filter).skip(skip).limit(limit).lean(),
            Restaurant.countDocuments(filter),
        ]);
        return { restaurants, total };
    }
    async findAllPaginated(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [restaurants, total] = await Promise.all([
            Restaurant.find()
                .populate("ownerId", "name email phoneNumber")
                .skip(skip)
                .limit(limit)
                .lean(),
            Restaurant.countDocuments(),
        ]);
        return { restaurants, total };
    }
    async findByIdAndUpdate(id, update) {
        return Restaurant.findByIdAndUpdate(id, update, { new: true }).lean();
    }
    async findByIdAndDelete(id) {
        return Restaurant.findByIdAndDelete(id).lean();
    }
}
