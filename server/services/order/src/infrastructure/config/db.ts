import mongoose from "mongoose";
import { resolveMongoUri, withConnectRetry } from "@bitez/shared";

export default async function connectDB(): Promise<void> {
  await withConnectRetry(
    () => mongoose.connect(resolveMongoUri("bitez_order")),
    {
      label: "mongodb",
      onRetry: (err, backoffMs) => {
        console.warn(`[order] mongodb connect failed; retrying in ${backoffMs}ms`, err);
      },
    },
  );
}
