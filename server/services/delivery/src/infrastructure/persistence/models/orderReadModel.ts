import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    restaurantId: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    deliveryAddress: { type: String, required: false },
    coordinates: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false },
    },
  },
  { timestamps: false }
);

export default mongoose.model("OrderReadModel", schema, "order_read_model_delivery");
