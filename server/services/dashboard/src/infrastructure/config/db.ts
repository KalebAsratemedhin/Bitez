import mongoose from "mongoose";
import { resolveMongoUri } from "@bitez/shared";

export default async function connectDB(): Promise<void> {
  await mongoose.connect(resolveMongoUri("bitez_dashboard"));
}
