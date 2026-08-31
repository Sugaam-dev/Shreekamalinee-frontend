import { useState } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { resetPasswordSchema } from "../../schemas/authSchemas.js";
import { useResetPasswordMutation } from "../../queries/useAuthQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import PasswordStrengthMeter from "../../components/common/PasswordStrengthMeter.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useCart();

  const initialEmail = location.state?.email || searchParams.get("email") || "";

  useSEO({
    title: "Create New Password — Shreekamalinee",
    description: "Set a strong new password for your account.",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const resetPasswordMutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: initialEmail,
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const passwordVal = watch("newPassword") || "";

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await resetPasswordMutation.mutateAsync({
        email: data.email.trim().toLowerCase(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });

      showToast("Password reset successfully! Please sign in with your new password.", "success");
      navigate("/login");
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid OTP code or password reset request expired. Please try again."
      );
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter the 6-digit reset code from your email and set a new password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Email Address */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
            Registered Email *
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="email"
              {...register("email")}
              placeholder="Enter your registered email"
              className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                errors.email ? "border-rose-500" : "border-line focus:border-rust"
              }`}
            />
          </div>
          {errors.email && (
            <span className="text-[11px] text-rose-600 mt-1 block">{errors.email.message}</span>
          )}
        </div>

        {/* 6-Digit Reset OTP */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
            6-Digit Reset OTP *
          </label>
          <div className="relative">
            <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="text"
              maxLength={6}
              {...register("otp")}
              placeholder="Enter 6-digit code"
              className={`w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold tracking-widest border rounded-xs outline-none bg-white ${
                errors.otp ? "border-rose-500" : "border-line focus:border-rust"
              }`}
            />
          </div>
          {errors.otp && (
            <span className="text-[11px] text-rose-600 mt-1 block">{errors.otp.message}</span>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
            New Password *
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type={showPassword ? "text" : "password"}
              {...register("newPassword")}
              placeholder="Min 8 chars, 1 uppercase, 1 symbol"
              className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                errors.newPassword ? "border-rose-500" : "border-line focus:border-rust"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordStrengthMeter password={passwordVal} />
          {errors.newPassword && (
            <span className="text-[11px] text-rose-600 mt-1 block">{errors.newPassword.message}</span>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
            Confirm New Password *
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmNewPassword")}
              placeholder="Re-enter your new password"
              className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                errors.confirmNewPassword ? "border-rose-500" : "border-line focus:border-rust"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmNewPassword && (
            <span className="text-[11px] text-rose-600 mt-1 block">{errors.confirmNewPassword.message}</span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={resetPasswordMutation.isPending}
          icon={ArrowRight}
        >
          Update Password & Sign In
        </Button>

        <div className="text-center pt-2 border-t border-line text-xs">
          <Link
            to="/login"
            className="text-charcoal/70 hover:text-rust font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
