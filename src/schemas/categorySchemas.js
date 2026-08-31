import { z } from "zod";

// Parity with Spring Boot CategoryRequest.java
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
  slug: z
    .string()
    .trim()
    .regex(
      /^$|^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional()
    .or(z.literal("")),
  parentId: z
    .string()
    .nullable()
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  suggestedAttributes: z
    .array(z.string())
    .default([]),
});
