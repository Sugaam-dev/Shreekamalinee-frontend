import { z } from "zod";

// Exact Backend Password Pattern from PasswordValidator.java:
// 8-30 characters, >=1 uppercase, >=1 lowercase, >=1 digit, >=1 special char, no whitespace
const PASSWORD_REGEX =
  /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_\-*()/?><,.:;"'{}|~`[\]\\])(?=\S+$).{8,30}$/;

const PASSWORD_ERROR_MSG =
  "Password must be 8-30 characters, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special symbol (@#$%^&+=!_*), and no spaces.";

// 1. Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

// 2. Registration Schema (100% Parity with Spring Boot RegistrationRequest.java)
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name cannot exceed 25 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(25, "Last name cannot exceed 25 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(
        /^\+?[1-9]\d{6,14}$/,
        "Please enter a valid phone number with country code (e.g. +91 9876543210)"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(30, "Password cannot exceed 30 characters")
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MSG),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// 3. Customer Profile Schema (100% Parity with UserAccountDTO.java)
export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(25, "First name cannot exceed 25 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(25, "Last name cannot exceed 25 characters"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(
      /^\+?[1-9]\d{6,14}$/,
      "Please enter a valid phone number with country code (e.g. +91 9876543210)"
    ),
});

// 4. Set / Change Password Schema (100% Parity with SetPasswordRequest.java)
export const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(30, "Password cannot exceed 30 characters")
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MSG),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// 5. OTP Verification Schema (100% Parity with OtpVerificationRequest.java)
export const otpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format"),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^[0-9]{6}$/, "OTP must contain only numbers"),
});

// 6. Forgot Password Schema (100% Parity with ForgotPasswordRequest.java)
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

// 7. Reset Password Schema (100% Parity with ResetPasswordRequest.java)
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email format"),
    otp: z
      .string()
      .trim()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^[0-9]{6}$/, "OTP must contain only numbers"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(30, "Password cannot exceed 30 characters")
      .regex(PASSWORD_REGEX, PASSWORD_ERROR_MSG),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// Helper for Real-Time Password Strength Calculation
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "Empty", color: "bg-gray-200" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[@#$%^&+=!_\-*()/?><,.:;"'{}|~`[\]\\]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "bg-rose-500" };
  if (score <= 4) return { score, label: "Medium", color: "bg-amber-500" };
  return { score, label: "Strong", color: "bg-emerald-600" };
}
