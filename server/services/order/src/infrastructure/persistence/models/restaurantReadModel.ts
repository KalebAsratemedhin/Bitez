import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    restaurantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, required: true },
    ownerId: { type: String, required: false },
  },
  { timestamps: false }
);

export default mongoose.model("RestaurantReadModel", schema, "restaurant_read_model_order");
