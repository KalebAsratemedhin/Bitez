import mongoose from "mongoose";
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    itemPicture: { type: String, default: "" },
}, { _id: true });
const menuSchema = new mongoose.Schema({
    menuName: { type: String, required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    menuItems: [menuItemSchema],
}, { timestamps: true });
export default mongoose.model("Menu", menuSchema);
