import type { IRestaurantRepository } from "../../domain/interfaces/index.js";

export class HttpRestaurantRepository implements IRestaurantRepository {
  constructor(private readonly baseUrl: string) {}

  async findById(id: string): Promise<unknown | null> {
    const base = this.baseUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/${id}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.data ?? data ?? null;
  }
}
