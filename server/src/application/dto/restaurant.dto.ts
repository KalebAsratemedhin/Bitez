export interface GetRestaurantsByOwnerInput {
  ownerId: string;
  page: number;
  limit: number;
}

export interface GetRestaurantsByOwnerResult {
  restaurants: unknown[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface CreateRestaurantInput {
  ownerId: string;
  name: string;
  address?: string;
  location?: unknown;
  logo?: string;
  latitude?: number;
  longitude?: number;
  deliveryAreaRadius?: number;
}

export interface UpdateRestaurantInput {
  restaurantId: string;
  ownerId: string;
  name?: string;
  address?: string;
  location?: unknown;
  logo?: string;
  latitude?: number;
  longitude?: number;
  deliveryAreaRadius?: number;
}

export interface GetActiveRestaurantsInput {
  page: number;
  limit: number;
  search?: string;
}

export interface GetActiveRestaurantsResult {
  restaurants: unknown[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface GetTopRestaurantsResult {
  restaurants: unknown[];
}
