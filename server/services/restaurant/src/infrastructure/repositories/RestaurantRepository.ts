import Restaurant from "../persistence/models/Restaurant.js";
import type { IRestaurantRepository } from "../../domain/interfaces/index.js";

export class RestaurantRepository implements IRestaurantRepository {
  async create(data: Record<string, unknown>) {
    const doc = new Restaurant(data);
    return doc.save();
  }

  async findById(id: string, populate: string[] = []) {
    let query = Restaurant.findById(id);
    if (populate.includes("ownerId")) query = query.populate("ownerId", "name email phoneNumber");
    if (populate.includes("menu")) query = query.populate("menu");
    return query.lean();
  }

  async findByOwnerId(ownerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      Restaurant.find({ ownerId }).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments({ ownerId }),
    ]);
    return { restaurants, total };
  }

  async findActive(filter: object = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filterWithStatus = { status: "active", ...filter };
    const [restaurants, total] = await Promise.all([
      Restaurant.find(filterWithStatus).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filterWithStatus),
    ]);
    return { restaurants, total };
  }

  async findActiveWithSearch(search: string | undefined, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { status: "active" };
    if (search) filter.name = { $regex: search, $options: "i" };
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

  async findByIdAndUpdate(id: string, update: Record<string, unknown>) {
    return Restaurant.findByIdAndUpdate(id, update, { new: true }).lean();
  }

  async findByIdAndDelete(id: string) {
    return Restaurant.findByIdAndDelete(id).lean();
  }
}
