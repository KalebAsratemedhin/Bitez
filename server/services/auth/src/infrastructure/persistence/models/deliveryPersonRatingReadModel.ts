import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    deliveryPersonId: { type: String, required: true, unique: true, index: true },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "delivery_person_rating_read_model" },
);

export default mongoose.model("DeliveryPersonRatingReadModel", schema);
