import Rating from "@models/rating.js";

export class RatingRepository {
  private normalizeEntityType(entityType: string): string {
    return entityType.toLowerCase();
  }

  async getUserRating(entityType: string, entityId: string, userId: string): Promise<number> {
    const doc = await Rating.findOne({
      entityType: this.normalizeEntityType(entityType),
      entityId: String(entityId),
      userId,
    })
      .lean()
      .exec();

    return doc?.rating ?? 0;
  }

  async setRating(
    entityType: string,
    entityId: string,
    userId: string,
    rating: number
  ): Promise<void> {
    await Rating.findOneAndUpdate(
      {
        entityType: this.normalizeEntityType(entityType),
        entityId: String(entityId),
        userId,
      },
      { $set: { rating } },
      { upsert: true, new: true }
    ).exec();
  }

  async getAverageRating(entityType: string, entityId: string): Promise<number> {
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

  async getAverageRatingsForEntities(
    entityType: string,
    entityIds: string[]
  ): Promise<Map<string, number>> {
    if (entityIds.length === 0) return new Map();

    const normalizedType = this.normalizeEntityType(entityType);
    const result = await Rating.aggregate([
      { $match: { entityType: normalizedType, entityId: { $in: entityIds.map(String) } } },
      { $group: { _id: "$entityId", avg: { $avg: "$rating" } } },
    ]).exec();

    const map = new Map<string, number>();
    for (const id of entityIds) {
      const row = result.find((r: { _id: string }) => String(r._id) === String(id));
      map.set(id, row?.avg ?? 0);
    }

    return map;
  }
}
