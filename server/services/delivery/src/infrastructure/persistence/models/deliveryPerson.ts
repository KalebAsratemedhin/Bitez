import mongoose from "mongoose";

const deliveryPersonSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "free" },
    rating: Number,
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryPerson", deliveryPersonSchema);
