import { z } from "zod";

// 1. Shipping & Delivery Configurations Schema
export const shippingSettingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().min(0, "Threshold must be >= 0").default(1499),
  standardShippingFee: z.coerce.number().min(0, "Shipping fee must be >= 0").default(99),
  codHandlingFee: z.coerce.number().min(0, "COD fee must be >= 0").default(99),
  isFreeShippingPromoActive: z.boolean().default(false),
  estimatedDeliveryDaysMin: z.coerce.number().min(1, "Minimum days must be at least 1").default(3),
  estimatedDeliveryDaysMax: z.coerce.number().min(1, "Maximum days must be at least 1").default(5),
  deliveryPolicyNotice: z.string().trim().optional().or(z.literal("")),
});

// 2. Top Announcement / Offer Bar Schema
export const announcementSettingsSchema = z.object({
  isAnnouncementActive: z.boolean().default(true),
  announcementText: z.string().trim().min(3, "Announcement text must be at least 3 characters"),
  announcementLink: z.string().trim().default("/shop"),
});

// 3. Customer Support & Contact Info Schema
export const contactSettingsSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^$|^\+?[1-9]\d{6,14}$/,
      "Please enter a valid WhatsApp phone number with country code (e.g. +919876543210)"
    )
    .optional()
    .or(z.literal("")),
  supportEmail: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  contactAddress: z.string().trim().optional().or(z.literal("")),
  operatingHours: z.string().trim().optional().or(z.literal("")),
});

// 4. Return & Exchange Policy Schema
export const returnPolicySettingsSchema = z.object({
  returnWindowDays: z.coerce.number().min(0, "Return window days must be >= 0").default(7),
  isReturnActive: z.boolean().default(true),
  returnPolicyText: z.string().trim().min(5, "Return policy text must be at least 5 characters"),
  deliveryPolicyNotice: z.string().trim().optional().or(z.literal("")),
});

// 5. Merchant Banking & Payment Gateways Schema
export const bankDetailsSchema = z.object({
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Account holder name must be at least 2 characters")
    .max(100, "Account holder name cannot exceed 100 characters"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, "Bank account number must be between 9 and 18 digits"),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Must be a valid 11-character Indian IFSC code (e.g. HDFC0001234)"),
  bankName: z
    .string()
    .trim()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name cannot exceed 100 characters"),
  branchName: z
    .string()
    .trim()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name cannot exceed 100 characters"),
  upiId: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/,
      "Must be a valid UPI ID (e.g. shreekamalinee@hdfcbank or store@upi)"
    ),
  isUpiPaymentActive: z.boolean().default(true),
  isRazorpayPaymentActive: z.boolean().default(true),
  isCodPaymentActive: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

// Backwards compatibility full schema
export const bankSettingsSchema = bankDetailsSchema
  .merge(shippingSettingsSchema)
  .merge(announcementSettingsSchema)
  .merge(contactSettingsSchema)
  .merge(returnPolicySettingsSchema);


