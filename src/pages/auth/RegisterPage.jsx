import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { registerSchema } from "../../schemas/authSchemas.js";
import { useRegisterMutation, useGoogleAuthMutation } from "../../queries/useAuthQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import PasswordStrengthMeter from "../../components/common/PasswordStrengthMeter.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUserSession } = useAuth();
  const { showToast } = useCart();
  const gisInitialized = useRef(false);


  useSEO({
    title: "Create Patron Account — Shreekamalinee",
    description: "Join Shree Kamalinee to experience authentic handloom sarees.",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const registerMutation = useRegisterMutation();
  const googleMutation = useGoogleAuthMutation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "+91",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordWatch = watch("password") || "";

  const handleEmailRegistration = async (data) => {
    setServerError("");

    try {
      const cleanPhone = data.phoneNumber.replace(/[\s-]/g, "");
      await registerMutation.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phoneNumber: cleanPhone,
        password: data.password,
      });

      showToast("Verification code dispatched to your email!", "success");
      navigate(`/verify-otp?email=${encodeURIComponent(data.email.trim().toLowerCase())}`, {
        state: { email: data.email.trim().toLowerCase() },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed. Please check your details.";
      setServerError(msg);
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes("placeholder")) return;

    const setupGoogleSignUp = () => {
      if (window.google?.accounts?.id && !gisInitialized.current) {
        gisInitialized.current = true;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response?.credential) {
              try {
                showToast("Connecting with Google...", "info");
                const authResponse = await googleMutation.mutateAsync({
                  googleIdToken: response.credential,
                });

                setUserSession(authResponse);
                showToast("Google account connected successfully!", "success");
                navigate("/account/profile", { replace: true });
              } catch (err) {
                const msg =
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  "Google signup failed. Please try again.";
                showToast(msg, "warning");
              }
            }
          },
        });

        const btnContainer = document.getElementById("google-signup-container");
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: btnContainer.offsetWidth || 340,
            text: "signup_with",
            shape: "rectangular",
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleSignUp();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleSignUp();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleMutation, navigate, setUserSession, showToast]);

  const handleGoogleSignup = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = document.querySelector("#google-signup-container div[role=button]");
          if (btn) {
            btn.click();
          }
        }
      });
    } else {
      showToast("Google services are loading. Please try again in a moment.", "info");
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Shree Kamalinee to experience authentic handwoven sarees"
    >
      <div className="space-y-5">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleEmailRegistration)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                First Name *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                <input
                  type="text"
                  {...register("firstName")}
                  placeholder="First name"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.firstName ? "border-rose-500" : "border-line focus:border-rust"
                  }`}
                />
              </div>
              {errors.firstName && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.firstName.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                Last Name *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                <input
                  type="text"
                  {...register("lastName")}
                  placeholder="Last name"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.lastName ? "border-rose-500" : "border-line focus:border-rust"
                  }`}
                />
              </div>
              {errors.lastName && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
              <input
                type="email"
                {...register("email")}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.email ? "border-rose-500" : "border-line focus:border-rust"
                }`}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-rose-600 mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Phone Number *
            </label>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry="in"
                  value={field.value}
                  onChange={(phone) => field.onChange(phone)}
                  inputClassName={`!w-full !py-2.5 !text-xs !bg-white !font-medium !rounded-xs !border ${
                    errors.phoneNumber ? "!border-rose-500" : "!border-line"
                  }`}
                  countrySelectorStyleProps={{
                    buttonClassName: "!border-line !bg-white !rounded-l-xs",
                  }}
                />
              )}
            />
            {errors.phoneNumber && (
              <span className="text-[11px] text-rose-600 mt-1 block">{errors.phoneNumber.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Create strong password"
                className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.password ? "border-rose-500" : "border-line focus:border-rust"
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
            {errors.password && (
              <span className="text-[11px] text-rose-600 mt-1 block">{errors.password.message}</span>
            )}
            <PasswordStrengthMeter password={passwordWatch || ""} />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="Repeat your password"
                className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.confirmPassword ? "border-rose-500" : "border-line focus:border-rust"
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
            {errors.confirmPassword && (
              <span className="text-[11px] text-rose-600 mt-1 block">{errors.confirmPassword.message}</span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={registerMutation.isPending}
            icon={ArrowRight}
          >
            Create Account & Send OTP
          </Button>
        </form>

        <div className="space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-line w-full" />
            <span className="bg-[#FAF9F5] px-3 text-[11px] uppercase tracking-wider text-charcoal/40 font-semibold absolute">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleMutation.isPending}
            className="w-full py-2.5 px-4 border border-line hover:border-charcoal/40 rounded-xs bg-white text-xs font-semibold text-charcoal flex items-center justify-center gap-2.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-rust border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>{googleMutation.isPending ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>
        </div>

        <p className="text-center text-xs text-charcoal/60 pt-2 border-t border-line">
          Already have an account?{" "}
          <Link to="/login" className="text-rust font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
