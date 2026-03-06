import type { IRestaurantRepository, IEventPublisher } from "../../domain/interfaces/index.js";
import type { Restaurant } from "../../domain/entities/Restaurant.js";
import type {
  GetRestaurantsByOwnerInput,
  GetRestaurantsByOwnerResult,
  CreateRestaurantInput,
  UpdateRestaurantInput,
  GetActiveRestaurantsInput,
  GetActiveRestaurantsResult,
  GetTopRestaurantsResult,
} from "../dto/restaurant.dto.js";

export interface RestaurantUseCaseDeps {
  restaurantRepository: IRestaurantRepository;
  eventPublisher: IEventPublisher;
}

function ownerIdString(restaurant: Restaurant): string {
  return typeof restaurant.ownerId === "string"
    ? restaurant.ownerId
    : restaurant.ownerId._id;
}

export class RestaurantUseCase {
  constructor(private readonly deps: RestaurantUseCaseDeps) {}

  async getById(restaurantId: string): Promise<Restaurant | null> {
    return this.deps.restaurantRepository.findById(restaurantId);
  }

  async getByOwnerId(input: GetRestaurantsByOwnerInput): Promise<GetRestaurantsByOwnerResult> {
    const { ownerId, page, limit } = input;

    const { restaurants, total } = await this.deps.restaurantRepository.findByOwnerId(
      ownerId,
      page,
      limit,
    );

    const totalPages = Math.ceil(total / limit);

    return { restaurants, total, totalPages, currentPage: page };
  }

  async create(input: CreateRestaurantInput): Promise<Restaurant> {
    if (!input.name?.trim()) throw new Error("Name is required");

    const created = await this.deps.restaurantRepository.create(input);

    await this.deps.eventPublisher.publish("restaurant.created", {
      restaurantId: created._id,
      ownerId: ownerIdString(created),
      name: created.name,
      status: created.status,
    });

    return created;
  }

  async update(input: UpdateRestaurantInput): Promise<Restaurant | null> {
    const { restaurantId, ownerId, ...updatePayload } = input;

    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);

    if (!restaurant) throw new Error("Restaurant not found");
    if (ownerIdString(restaurant) !== ownerId) {
      throw new Error("Not the owner of this restaurant");
    }

    const updated = await this.deps.restaurantRepository.findByIdAndUpdate(
      restaurantId,
      updatePayload as Record<string, unknown>,
    );

    if (!updated) throw new Error("Restaurant not found");

    await this.deps.eventPublisher.publish("restaurant.updated", {
      restaurantId: updated._id,
      ownerId: ownerIdString(updated),
      name: updated.name,
      status: updated.status,
    });

    return updated;
  }

  async delete(restaurantId: string, ownerId: string): Promise<Restaurant | null> {
    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);

    if (!restaurant) throw new Error("Restaurant not found");
    if (ownerIdString(restaurant) !== ownerId) {
      throw new Error("Not the owner of this restaurant");
    }

    return this.deps.restaurantRepository.findByIdAndDelete(restaurantId);
  }

  async getActive(input: GetActiveRestaurantsInput): Promise<GetActiveRestaurantsResult> {
    const { page, limit, search } = input;

    const { restaurants, total } = await this.deps.restaurantRepository.findActiveWithSearch(
      search?.trim() || undefined,
      page,
      limit,
    );

    const totalPages = Math.ceil(total / limit);

    return { restaurants, total, totalPages, currentPage: page };
  }

  async getTopRestaurants(limit = 10): Promise<GetTopRestaurantsResult> {
    const { restaurants } = await this.deps.restaurantRepository.findActive(
      {},
      1,
      limit,
    );

    return { restaurants };
  }
}