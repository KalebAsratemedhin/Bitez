import mongoose from "mongoose";
import Notification from "@models/notification.js";
import type { INotificationRepository } from "@domain/interfaces/index.js";

export class NotificationRepository implements INotificationRepository {
  async findByUserId(userId: string) {
    const list = await Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
    return list;
  }

  async markAsSeen(id: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) },
      { seen: true },
      { new: true }
    ).lean();
  }
}
