import { z } from "zod";

export const updateDeliveryStatusBodySchema = z.object({
  status: z.enum(["assigned", "picked_up", "on_the_way", "delivered", "failed"]),
});

export const createDeliveryPersonBodySchema = z.object({
  userId: z.string().trim().min(1),
});
