import { z } from "zod";

export const signupBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  phoneNumber: z.string().trim().min(1),
  address: z.string().trim().min(1),
  role: z.enum(["admin", "customer", "restaurant_owner", "delivery_person"]),
});

export const signinBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phoneNumber: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const tokenRevokedBodySchema = z.object({
  token: z.string().trim().min(1),
});
