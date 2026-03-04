import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    deliveryId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    deliveryPersonUserId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { timestamps: false }
);

export default mongoose.model("DeliveryReadModel", schema, "delivery_read_model");
