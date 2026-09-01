import { z } from "zod";

// Matching CouponRequest.java
export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters")
    .max(30, "Coupon code cannot exceed 30 characters")
    .regex(/^[A-Za-z0-9_-]{3,30}$/, "Code must contain only letters, numbers, hyphens, and underscores"),
  discountType: z.enum(["PERCENTAGE", "FIXED"], {
    errorMap: () => ({ message: "Discount type must be PERCENTAGE or FIXED" }),
  }),
  discountValue: z.coerce.number().positive("Discount value must be greater than zero"),
  minPurchaseAmount: z.coerce.number().min(0, "Minimum purchase amount cannot be negative").default(0),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscountAmount: z.coerce.number().min(0, "Maximum discount cap cannot be negative").optional().nullable(),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: "Expiry date must be set to a future date & time",
    }),
  active: z.boolean().default(true),

  applicableCategoryIds: z.array(z.string()).default([]),
  applicableProductIds: z.array(z.string()).default([]),
  applicableUserEmails: z.array(z.string()).default([]),
});
