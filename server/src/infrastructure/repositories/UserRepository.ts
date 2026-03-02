import User from "@models/user.js";
import type { IUserRepository } from "@domain/interfaces/index.js";

export class UserRepository implements IUserRepository {
  async findById(
    id: string,
    options: { includePassword?: boolean; excludePassword?: boolean } = {},
  ) {
    let query = User.findById(id);
    if (options.includePassword) query = query.select("+password");
    else query = query.select("-password");
    return query.lean();
  }

  async findByEmail(
    email: string,
    options: { includePassword?: boolean } = {},
  ) {
    let query = User.findOne({ email });
    if (options.includePassword) query = query.select("+password");
    return query.lean();
  }

  async create(data: Record<string, unknown>) {
    return User.create(data);
  }

  async findByIdAndUpdate(id: string, update: Record<string, unknown>) {
    return User.findByIdAndUpdate(id, update, { new: true })
      .select("-password")
      .lean();
  }

  async findByIdAndDelete(id: string) {
    return User.findByIdAndDelete(id).lean();
  }

  async findAllPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).select("-password").lean(),
      User.countDocuments(),
    ]);
    return { users, total };
  }
}
