import { z } from "zod";

export const createOrderBodySchema = z.object({
  restaurantID: z.string().trim().min(1),
  orderDetails: z
    .array(
      z.object({
        item: z.any(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  totalAmount: z.number().nonnegative().optional(),
  deliveryAddress: z.string().trim().min(1),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.string().trim().min(1),
});

export const payForOrderBodySchema = z.object({
  orderId: z.string().trim().min(1),
  total: z.number().positive(),
});
