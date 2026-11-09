import { z } from "zod";

export const notifyBodySchema = z.object({
  userId: z.string().trim().min(1),
  message: z.string().trim().min(1),
  type: z.string().trim().min(1).optional(),
});
