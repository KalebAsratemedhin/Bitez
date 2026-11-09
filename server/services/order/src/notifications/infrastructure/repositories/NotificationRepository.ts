import mongoose from "mongoose";
import type { INotificationRepository } from "../../domain/interfaces/NotificationRepository.js";
import Notification from "../persistence/models/notification.js";

export class NotificationRepository implements INotificationRepository {
  async create(data: {
    userId: string;
    message: string;
    type?: string;
  }): Promise<unknown> {
    const doc = await Notification.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      message: data.message,
      type: data.type ?? "general",
    });
    return doc.toObject ? doc.toObject() : doc;
  }

  async findByUserId(userId: string): Promise<unknown[]> {
    return Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async markAsSeen(id: string, userId: string): Promise<unknown | null> {
    return Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) },
      { seen: true },
      { new: true },
    ).lean();
  }
}
