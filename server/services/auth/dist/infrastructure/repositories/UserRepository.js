import User from "../persistence/models/user.js";
export class UserRepository {
    async findById(id, options = {}) {
        let query = User.findById(id);
        if (options.includePassword)
            query = query.select("+password");
        else
            query = query.select("-password");
        return query.lean();
    }
    async findByEmail(email, options = {}) {
        let query = User.findOne({ email });
        if (options.includePassword)
            query = query.select("+password");
        return query.lean();
    }
    async create(data) {
        return User.create(data);
    }
    async findByIdAndUpdate(id, update) {
        return User.findByIdAndUpdate(id, update, { new: true })
            .select("-password")
            .lean();
    }
    async findByIdAndDelete(id) {
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
