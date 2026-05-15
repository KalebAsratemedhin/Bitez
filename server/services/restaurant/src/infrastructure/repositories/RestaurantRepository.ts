import type { IRestaurantRepository } from "../../domain/interfaces/index.js";
import type { Restaurant as RestaurantEntity, PaginatedRestaurants, RestaurantOwner } from "@domain/entities/Restaurant.js";
import type { CreateRestaurantInput, UpdateRestaurantInput } from "@application/dto/restaurant.dto.js";
import Restaurant from "../persistence/models/Restaurant.js";

function toRestaurant(doc: Record<string, unknown>): RestaurantEntity {
  const owner = doc.ownerId as RestaurantOwner | string;
  return {
    _id: String(doc._id ?? ""),
    name: String(doc.name ?? ""),
    location: String(doc.location ?? ""),
    ownerId: owner,
    status: String(doc.status ?? ""),
    menu: doc.menu,
    logo: doc.logo != null ? String(doc.logo) : undefined,
    latitude: typeof doc.latitude === "number" ? doc.latitude : undefined,
    longitude: typeof doc.longitude === "number" ? doc.longitude : undefined,
    deliveryAreaRadius: typeof doc.deliveryAreaRadius === "number" ? doc.deliveryAreaRadius : undefined,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : undefined,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : undefined,
  };
}

export class RestaurantRepository implements IRestaurantRepository {
  async create(data: CreateRestaurantInput): Promise<RestaurantEntity> {
    const input = data;
    const doc = new Restaurant({
      ...input,
      status: "active",
    });
    const saved = await doc.save();
    return toRestaurant(saved.toObject());
  }

  async findById(id: string, _populate?: string[]): Promise<RestaurantEntity | null> {
    const doc = await Restaurant.findById(id).lean();
    if (!doc) return null;
    return toRestaurant(doc as Record<string, unknown>);
  }

  async findByOwnerId(
    ownerId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedRestaurants> {
    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      Restaurant.find({ ownerId }).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments({ ownerId }),
    ]);
    return {
      restaurants: (restaurants as Record<string, unknown>[]).map(toRestaurant),
      total,
    };
  }

  async findActive(
    filter: object = {},
    page = 1,
    limit = 10,
  ): Promise<PaginatedRestaurants> {
    const skip = (page - 1) * limit;
    const filterWithStatus = { status: "active", ...filter };
    const [restaurants, total] = await Promise.all([
      Restaurant.find(filterWithStatus).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filterWithStatus),
    ]);
    return {
      restaurants: (restaurants as Record<string, unknown>[]).map(toRestaurant),
      total,
    };
  }

  async findActiveWithSearch(
    search: string | undefined,
    page = 1,
    limit = 10,
  ): Promise<PaginatedRestaurants> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { status: "active" };
    if (search) filter.name = { $regex: search, $options: "i" };
    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filter),
    ]);
    return {
      restaurants: (restaurants as Record<string, unknown>[]).map(toRestaurant),
      total,
    };
  }

  async findAllPaginated(page = 1, limit = 10): Promise<PaginatedRestaurants> {
    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      Restaurant.find().skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(),
    ]);
    return {
      restaurants: (restaurants as Record<string, unknown>[]).map(toRestaurant),
      total,
    };
  }

  async findByIdAndUpdate(
    id: string,
    update: Record<string, unknown>,
  ): Promise<RestaurantEntity | null> {
    const doc = await Restaurant.findByIdAndUpdate(id, update, { new: true }).lean({
      virtuals: true,
    });
    if (!doc) return null;
    return toRestaurant(doc as Record<string, unknown>);
  }

  async findByIdAndDelete(id: string): Promise<RestaurantEntity | null> {
    const doc = await Restaurant.findByIdAndDelete(id).lean();
    if (!doc) return null;
    return toRestaurant(doc as Record<string, unknown>);
  }
}