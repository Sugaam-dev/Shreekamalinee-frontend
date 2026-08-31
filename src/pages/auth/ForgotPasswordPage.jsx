import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { forgotPasswordSchema } from "../../schemas/authSchemas.js";
import { useForgotPasswordMutation } from "../../queries/useAuthQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useCart();
  const [serverError, setServerError] = useState("");
  const forgotPasswordMutation = useForgotPasswordMutation();

  useSEO({
    title: "Forgot Password — Shreekamalinee",
    description: "Recover access to your Shreekamalinee royal account.",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await forgotPasswordMutation.mutateAsync({ email: data.email });
      showToast(`If this email is registered, a password reset OTP has been sent.`, "info");
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to process password reset request.");
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your registered email and we'll dispatch a 10-minute reset OTP"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
            Registered Email Address *
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={forgotPasswordMutation.isPending}
          icon={ArrowRight}
        >
          Send Password Reset OTP
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
