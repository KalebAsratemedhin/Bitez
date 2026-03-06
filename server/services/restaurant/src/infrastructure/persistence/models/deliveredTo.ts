import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    deliveryPersonId: { type: String, required: true },
    customerUserId: { type: String, required: true },
  },
  { timestamps: false }
);

schema.index({ deliveryPersonId: 1, customerUserId: 1 }, { unique: true });

export default mongoose.model("DeliveredTo", schema, "delivered_to");
