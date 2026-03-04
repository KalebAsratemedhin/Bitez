import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

ratingSchema.index(
  { entityType: 1, entityId: 1, userId: 1 },
  { unique: true }
);

ratingSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.model("Rating", ratingSchema);
