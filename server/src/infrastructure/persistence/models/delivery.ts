import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPerson" },
    status: String,
    estimatedDeliveryTime: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Delivery", deliverySchema);
