import type { IUserRepository } from "../../domain/interfaces/index.js";

export class HttpUserRepository implements IUserRepository {
  constructor(private readonly baseUrl: string) {}

  async findById(id: string, options?: { authHeader?: string }): Promise<unknown | null> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/current-user`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options?.authHeader) headers.Authorization = options.authHeader;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const user = await res.json();
    const userId = (user as { _id?: string })._id ?? (user as { id?: string }).id;
    if (userId && String(userId) !== id) return null;
    return user;
  }
}
