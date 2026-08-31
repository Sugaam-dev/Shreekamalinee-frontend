import { z } from "zod";

// Schema matching OrderStatusUpdateRequest.java
export const orderStatusUpdateSchema = z.object({
  status: z.enum(["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"], {
    errorMap: () => ({ message: "Status must be PLACED, PROCESSING, SHIPPED, DELIVERED, or CANCELLED" }),
  }),
  courierName: z.string().trim().optional().or(z.literal("")),
  trackingNumber: z.string().trim().optional().or(z.literal("")),
  trackingUrl: z.string().trim().optional().or(z.literal("")),
  estimatedDeliveryDate: z.string().optional().or(z.literal("")),
  cancellationReason: z.string().trim().optional().or(z.literal("")),
});


