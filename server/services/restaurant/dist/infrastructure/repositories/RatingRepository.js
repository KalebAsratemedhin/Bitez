import Rating from "../persistence/models/rating.js";
export class RatingRepository {
    normalizeEntityType(entityType) {
        return entityType.toLowerCase();
    }
    async getUserRating(entityType, entityId, userId) {
        const doc = await Rating.findOne({
            entityType: this.normalizeEntityType(entityType),
            entityId: String(entityId),
            userId,
        })
            .lean()
            .exec();
        return doc?.rating ?? 0;
    }
    async setRating(entityType, entityId, userId, rating) {
        await Rating.findOneAndUpdate({
            entityType: this.normalizeEntityType(entityType),
            entityId: String(entityId),
            userId,
        }, { $set: { rating } }, { upsert: true, new: true }).exec();
    }
    async getAverageRating(entityType, entityId) {
        const result = await Rating.aggregate([
            {
                $match: {
                    entityType: this.normalizeEntityType(entityType),
                    entityId: String(entityId),
                },
            },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]).exec();
        const row = result[0];
        return row?.avg ?? 0;
    }
    async getTopRatedEntityIds(entityType, limit) {
        const normalizedType = this.normalizeEntityType(entityType);
        const result = await Rating.aggregate([
            { $match: { entityType: normalizedType } },
            { $group: { _id: "$entityId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
            { $sort: { avg: -1, count: -1 } },
            { $limit: limit },
        ]).exec();
        return result.map((r) => ({
            entityId: String(r._id),
            avg: r.avg,
        }));
    }
}
