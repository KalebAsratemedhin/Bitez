import type { Request, Response } from "express";
import type { RestaurantUseCase } from "@application/usecases/RestaurantUseCase.js";
import type { RatingRepository } from "@infrastructure/repositories/RatingRepository.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

function getUserId(req: AuthenticatedRequest): string {
  return req.user!.id;
}

function toRestaurantResponse(r: unknown, ratingOverride?: number): Record<string, unknown> {
  const x = r as {
    _id?: unknown;
    name?: string;
    location?: unknown;
    ownerId?: unknown;
    status?: string;
    logo?: string;
    latitude?: number;
    longitude?: number;
    deliveryAreaRadius?: number;
  };
  const loc = x.location;
  const hasCoords =
    typeof x.latitude === "number" && typeof x.longitude === "number";
  const coordinates =
    hasCoords ? [x.longitude!, x.latitude!] : ([] as number[]);
  const address =
    typeof loc === "string" ? loc : (loc as { address?: string })?.address ?? "";
  const locationNormalized = {
    type: "Point" as const,
    coordinates,
    address,
  };
  return {
    _id: String(x._id ?? ""),
    name: x.name ?? "",
    location: locationNormalized,
    latitude: typeof x.latitude === "number" ? x.latitude : undefined,
    longitude: typeof x.longitude === "number" ? x.longitude : undefined,
    deliveryAreaRadius:
      typeof x.deliveryAreaRadius === "number" ? x.deliveryAreaRadius : 5000,
    logo: x.logo ?? "",
    status: x.status ?? "active",
    rating: ratingOverride !== undefined ? ratingOverride : 0,
    ownerId: x.ownerId,
  };
}

const ENTITY_TYPE_RESTAURANT = "restaurant";

export class RestaurantController {
  constructor(
    private readonly restaurantUseCase: RestaurantUseCase,
    private readonly ratingRepository?: RatingRepository
  ) {}

  private async getAverageRatingForRestaurant(restaurantId: string): Promise<number> {
    return this.ratingRepository
      ? await this.ratingRepository.getAverageRating(ENTITY_TYPE_RESTAURANT, restaurantId)
      : 0;
  }

  getMine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const result = await this.restaurantUseCase.getByOwnerId({
        ownerId: getUserId(req),
        page,
        limit,
      });
      const data = await Promise.all(
        result.restaurants.map(async (r) => {
          const id = String((r as { _id?: unknown })._id ?? "");
          const rating = await this.getAverageRatingForRestaurant(id);
          return toRestaurantResponse(r, rating);
        })
      );
      res.json({
        message: "OK",
        data,
        totalCount: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const body = req.body as {
        name?: string;
        address?: string;
        location?: unknown;
        logo?: string;
        latitude?: string | number;
        longitude?: string | number;
        deliveryAreaRadius?: string | number;
      };
      const file = (req as Request & { file?: { filename: string } }).file;
      const logo = file ? `/uploads/restaurants/${file.filename}` : body.logo ?? "";
      await this.restaurantUseCase.create({
        ownerId: userId,
        name: body.name ?? "",
        address: body.address,
        location: body.location,
        logo,
        latitude: body.latitude != null ? Number(body.latitude) : undefined,
        longitude: body.longitude != null ? Number(body.longitude) : undefined,
        deliveryAreaRadius:
          body.deliveryAreaRadius != null
            ? Number(body.deliveryAreaRadius)
            : undefined,
      });
      res.status(201).json({ message: "Restaurant created successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const body = req.body as {
        name?: string;
        address?: string;
        location?: unknown;
        latitude?: string | number;
        longitude?: string | number;
        deliveryAreaRadius?: string | number;
      };
      const file = (req as Request & { file?: { filename: string } }).file;
      const logo = file ? `/uploads/restaurants/${file.filename}` : undefined;
      await this.restaurantUseCase.update({
        restaurantId: id,
        ownerId: getUserId(req),
        name: body.name,
        address: body.address,
        location: body.location,
        logo,
        latitude:
          body.latitude != null && body.latitude !== ""
            ? Number(body.latitude)
            : undefined,
        longitude:
          body.longitude != null && body.longitude !== ""
            ? Number(body.longitude)
            : undefined,
        deliveryAreaRadius:
          body.deliveryAreaRadius != null && body.deliveryAreaRadius !== ""
            ? Number(body.deliveryAreaRadius)
            : undefined,
      });
      res.json({ message: "Restaurant updated successfully" });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Not the owner")) res.status(403).json({ error: err.message });
      else if (err.message?.includes("not found")) res.status(404).json({ error: err.message });
      else res.status(500).json({ error: err.message });
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      await this.restaurantUseCase.delete(id, getUserId(req));
      res.json({ message: "Restaurant deleted successfully" });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Not the owner")) res.status(403).json({ error: err.message });
      else if (err.message?.includes("not found")) res.status(404).json({ error: err.message });
      else res.status(500).json({ error: err.message });
    }
  };

  getActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
      const result = await this.restaurantUseCase.getActive({ page, limit, search });
      const data = await Promise.all(
        result.restaurants.map(async (r) => {
          const id = String((r as { _id?: unknown })._id ?? "");
          const rating = await this.getAverageRatingForRestaurant(id);
          return toRestaurantResponse(r, rating);
        })
      );
      res.json({
        message: "OK",
        data,
        totalCount: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const restaurant = await this.restaurantUseCase.getById(id);
      if (!restaurant) {
        res.status(404).json({ error: "Restaurant not found" });
        return;
      }
      const rating = await this.getAverageRatingForRestaurant(id);
      res.json({ message: "OK", data: toRestaurantResponse(restaurant, rating) });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  getTopRestaurants = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.restaurantUseCase.getTopRestaurants(10);
      const data = await Promise.all(
        result.restaurants.map(async (r) => {
          const rid = String((r as { _id?: unknown })._id ?? "");
          const rating = await this.getAverageRatingForRestaurant(rid);
          return toRestaurantResponse(r, rating);
        })
      );
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };
}
