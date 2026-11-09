import type { IUserRepository } from "../../domain/interfaces/index.js";

/**
 * Pulls user data from auth.
 * - With Authorization: GET /current-user (caller JWT; used for payment email).
 * - Without: GET /internal/user/:id (service token; enrichment).
 */
export class HttpUserRepository implements IUserRepository {
  constructor(private readonly baseUrl: string) {}

  async findById(id: string, options?: { authHeader?: string }): Promise<unknown | null> {
    const base = this.baseUrl.replace(/\/$/, "");
    if (options?.authHeader) {
      const res = await fetch(`${base}/current-user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: options.authHeader,
        },
      });
      if (!res.ok) return null;
      const user = await res.json();
      const userId = (user as { _id?: string })._id ?? (user as { id?: string }).id;
      if (userId && String(userId) !== id) return null;
      return user;
    }

    const token = process.env.INTERNAL_SERVICE_TOKEN?.trim();
    if (!token) return null;
    const res = await fetch(`${base}/internal/user/${encodeURIComponent(id)}`, {
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": token,
      },
    });
    if (!res.ok) return null;
    return res.json();
  }
}
