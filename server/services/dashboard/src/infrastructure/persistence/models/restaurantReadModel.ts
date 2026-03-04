import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    restaurantId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: false }
);

export default mongoose.model("RestaurantReadModel", schema, "restaurant_read_model");
