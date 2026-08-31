import { z } from "zod";

// Matching ReviewRequest.java
export const reviewSchema = z.object({
  reviewerName: z.string().trim().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  title: z.string().trim().optional().or(z.literal("")),
  comment: z.string().trim().min(2, "Review comment must be at least 2 characters"),
});
