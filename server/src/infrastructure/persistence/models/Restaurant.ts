import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: String,
    location: String,
    latitude: Number,
    longitude: Number,
    deliveryAreaRadius: { type: Number, default: 5000 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "active" },
    menu: mongoose.Schema.Types.Mixed,
    logo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
