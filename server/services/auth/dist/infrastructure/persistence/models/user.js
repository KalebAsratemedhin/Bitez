import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    phoneNumber: String,
    address: String,
    role: String,
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model("User", userSchema);
