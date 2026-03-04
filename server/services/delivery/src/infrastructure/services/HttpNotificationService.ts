import type { INotificationService } from "../../domain/interfaces/index.js";

export class HttpNotificationService implements INotificationService {
  constructor(private readonly baseUrl: string) {}

  async sendToUser(userId: string, message: string, type = "general"): Promise<void> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/notify`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message, type }),
    }).catch(() => {});
  }
}
