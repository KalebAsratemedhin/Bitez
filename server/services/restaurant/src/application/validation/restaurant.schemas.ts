import { z } from "zod";

function optionalCoercedNumber() {
  return z
    .union([z.string(), z.number()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expected number" });
        return z.NEVER;
      }
      return n;
    });
}

export const createRestaurantBodySchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  logo: z.string().optional(),
  latitude: optionalCoercedNumber(),
  longitude: optionalCoercedNumber(),
  deliveryAreaRadius: optionalCoercedNumber(),
});

export const updateRestaurantBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  location: z.union([z.string().trim().min(1), z.record(z.unknown())]).optional(),
  latitude: optionalCoercedNumber(),
  longitude: optionalCoercedNumber(),
  deliveryAreaRadius: optionalCoercedNumber(),
});

const menuItemSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
  price: z.coerce.number().nonnegative(),
});

export const createMenuBodySchema = z
  .object({
    menuName: z.string().trim().min(1),
    menuItems: z.string().trim().min(2),
  })
  .superRefine((body, ctx) => {
    try {
      const items = JSON.parse(body.menuItems);
      const parsed = z.array(menuItemSchema).min(1).safeParse(items);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one valid menu item is required",
          path: ["menuItems"],
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid menuItems JSON",
        path: ["menuItems"],
      });
    }
  })
  .transform((body) => {
    const items = z.array(menuItemSchema).parse(JSON.parse(body.menuItems));
    return { menuName: body.menuName, menuItems: items };
  });
