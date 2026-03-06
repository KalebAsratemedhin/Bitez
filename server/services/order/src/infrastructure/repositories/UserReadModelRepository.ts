import type {
  IUserReadModelRepository,
  UserReadModelItem,
} from "../../domain/interfaces/UserReadModelRepository.js";
import UserReadModel from "../persistence/models/userReadModel.js";

export class UserReadModelRepository implements IUserReadModelRepository {
  async upsert(item: UserReadModelItem): Promise<void> {
    await UserReadModel.findOneAndUpdate(
      { userId: item.userId },
      { $set: { name: item.name, email: item.email, phoneNumber: item.phoneNumber } },
      { upsert: true }
    );
  }

  async findById(userId: string): Promise<UserReadModelItem | null> {
    const doc = await UserReadModel.findOne({ userId }).lean();
    if (!doc) return null;
    const d = doc as Record<string, unknown>;
    return {
      userId: String(d.userId ?? ""),
      name: String(d.name ?? ""),
      email: String(d.email ?? ""),
      phoneNumber: d.phoneNumber != null ? String(d.phoneNumber) : undefined,
    };
  }
}
