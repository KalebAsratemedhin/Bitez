import type { IDeliveryPersonRepository } from "../../domain/interfaces/index.js";

export class HttpDeliveryPersonRepository implements IDeliveryPersonRepository {
  constructor(private readonly baseUrl: string) {}

  async findByUserId(userId: string): Promise<unknown | null> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/delivery-person/by-user/${encodeURIComponent(userId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data ?? null;
  }
}
