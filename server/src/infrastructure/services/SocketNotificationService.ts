import Notification from "@models/notification.js";
import type { INotificationService } from "@domain/interfaces/index.js";

type GetIo = () => {
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
} | null;

export class SocketNotificationService implements INotificationService {
  constructor(private readonly getIo: GetIo) {}

  async sendToUser(userId: string, message: string, type = "general") {
    const notification = await Notification.create({ userId, message, type });
    const io = this.getIo();
    if (io) io.to(String(userId)).emit("new-notification", notification);
  }
}
