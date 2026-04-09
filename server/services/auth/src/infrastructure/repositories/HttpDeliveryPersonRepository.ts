import type { IDeliveryPersonRepository } from "../../domain/interfaces/index.js";

export class HttpDeliveryPersonRepository implements IDeliveryPersonRepository {
  constructor(private readonly baseUrl: string) {}

  async findByUserId(userId: string): Promise<unknown | null> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/delivery-person/by-user/${encodeURIComponent(userId)}`;
    const token = process.env.INTERNAL_SERVICE_TOKEN?.trim();
    const headers: Record<string, string> = {};
    if (token) headers["X-Internal-Token"] = token;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data ?? null;
  }
}
