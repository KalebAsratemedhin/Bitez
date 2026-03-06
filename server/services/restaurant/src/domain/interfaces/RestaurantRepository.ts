import { CreateRestaurantInput } from "@application/dto/restaurant.dto.ts";
import type { Restaurant, PaginatedRestaurants } from "../entities/Restaurant.ts";

export interface IRestaurantRepository {
  create(data: CreateRestaurantInput): Promise<Restaurant>;
  findById(id: string, populate?: string[]): Promise<Restaurant | null>;
  findByOwnerId(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedRestaurants>;
  findActive(
    filter: object,
    page: number,
    limit: number,
  ): Promise<PaginatedRestaurants>;
  findActiveWithSearch(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedRestaurants>;
  findAllPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedRestaurants>;
  findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<Restaurant | null>;
  findByIdAndDelete(id: string): Promise<Restaurant | null>;
}