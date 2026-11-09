import mongoose from "mongoose";

const unassignedOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: false },
    restaurantId: { type: String, required: false },
    estimatedDeliveryTime: { type: Date, required: true },
    deliveryAddress: { type: String, required: false },
    coordinates: { lat: Number, lng: Number },
  },
  { timestamps: true }
);

export default mongoose.model("UnassignedOrder", unassignedOrderSchema);