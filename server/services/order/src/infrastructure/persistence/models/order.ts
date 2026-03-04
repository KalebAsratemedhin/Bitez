import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restaurantID: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    orderDetails: [{ item: mongoose.Schema.Types.Mixed, quantity: Number }],
    totalAmount: Number,
    deliveryAddress: String,
    coordinates: { lat: Number, lng: Number },
    status: String,
    paymentCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
