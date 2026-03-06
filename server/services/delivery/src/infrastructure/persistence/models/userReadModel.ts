import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: false },
  },
  { timestamps: false }
);

export default mongoose.model("UserReadModel", schema, "user_read_model_delivery");
