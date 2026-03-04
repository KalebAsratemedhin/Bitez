import mongoose from "mongoose";
import Notification from "../persistence/models/notification.js";
export class NotificationRepository {
    async create(data) {
        const doc = await Notification.create({
            userId: new mongoose.Types.ObjectId(data.userId),
            message: data.message,
            type: data.type ?? "general",
        });
        return doc.toObject ? doc.toObject() : doc;
    }
    async findByUserId(userId) {
        return Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();
    }
    async markAsSeen(id, userId) {
        return Notification.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) }, { seen: true }, { new: true }).lean();
    }
}
