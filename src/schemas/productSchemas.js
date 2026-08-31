import { z } from "zod";

// Variant Schema matching VariantRequest.java
export const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color is required"),
  stockQuantity: z.coerce.number().min(0, "Stock quantity cannot be negative"),
  sku: z
    .string()
    .trim()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9_-]{3,50}$/, "SKU must contain only letters, numbers, hyphens, and underscores"),
});

// Product Schema matching ProductRequest.java
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(255, "Product name cannot exceed 255 characters"),
  description: z.string().trim().optional().or(z.literal("")),
  brand: z.string().trim().min(1, "Brand is required"),
  originalPrice: z.coerce
    .number()
    .positive("Original price must be greater than 0"),
  offerPrice: z.coerce
    .number()
    .min(0, "Offer price must be 0 or positive")
    .optional()
    .or(z.literal("")),
  sku: z
    .string()
    .trim()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9_-]{3,50}$/, "SKU must contain only letters, numbers, hyphens, and underscores"),
  genderCategory: z
    .enum(["WOMEN", "MEN", "KIDS", "UNISEX"], {
      errorMap: () => ({ message: "Gender category must be WOMEN, MEN, KIDS, or UNISEX" }),
    }),
  season: z.string().trim().optional().or(z.literal("")),
  artisanalStory: z.string().trim().optional().or(z.literal("")),
  fabricCare: z.string().trim().optional().or(z.literal("")),
  shippingPolicy: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().uuid("Please select a valid category"),
  highlights: z.record(z.string()).default({}),
  aboutItem: z.array(z.string()).default([]),
  variants: z.array(variantSchema).default([]),
});
