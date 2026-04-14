import Rating from "../persistence/models/rating.js";

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

  /** One aggregation for many entity IDs (avoids N+1). Missing IDs get 0. */
  async getAverageRatingsMap(
    entityType: string,
    entityIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    const normalizedType = this.normalizeEntityType(entityType);
    const ids = [...new Set(entityIds.map((id) => String(id)).filter(Boolean))];
    if (ids.length === 0) return map;
    const result = await Rating.aggregate([
      { $match: { entityType: normalizedType, entityId: { $in: ids } } },
      { $group: { _id: "$entityId", avg: { $avg: "$rating" } } },
    ]).exec();
    for (const row of result as { _id: string; avg?: number }[]) {
      map.set(String(row._id), row.avg ?? 0);
    }
    return map;
  }

  async getTopRatedEntityIds(
    entityType: string,
    limit: number
  ): Promise<{ entityId: string; avg: number }[]> {
    const normalizedType = this.normalizeEntityType(entityType);
    const result = await Rating.aggregate([
      { $match: { entityType: normalizedType } },
      { $group: { _id: "$entityId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      { $sort: { avg: -1, count: -1 } },
      { $limit: limit },
    ]).exec();
    return (result as { _id: string; avg: number }[]).map((r) => ({
      entityId: String(r._id),
      avg: r.avg,
    }));
  }
}
