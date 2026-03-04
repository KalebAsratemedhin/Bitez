import mongoose from "mongoose";

export default async function connectDB(): Promise<void> {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/bitez_default";
  await mongoose.connect(uri);
}