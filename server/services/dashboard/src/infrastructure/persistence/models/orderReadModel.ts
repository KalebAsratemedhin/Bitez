import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { timestamps: false }
);

export default mongoose.model("OrderReadModel", schema, "order_read_model");
