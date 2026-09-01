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
    description: "Join Shreekamalinee to experience authentic handloom sarees.",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);

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
          use_fedcm_for_prompt: true,
          callback: async (response) => {
            if (response?.credential) {
              try {
                setIsGoogleProcessing(true);
                const authResponse = await googleMutation.mutateAsync({
                  googleIdToken: response.credential,
                });

                setUserSession(authResponse);
                showToast("Google account connected successfully!", "success");
                navigate("/account/profile", { replace: true });
              } catch (err) {
                setIsGoogleProcessing(false);
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
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: "signup_with",
            logo_alignment: "left",
            width: Math.min(btnContainer.parentElement?.offsetWidth || 340, 360),
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

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Shreekamalinee to experience authentic handwoven sarees"
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

        {/* Divider */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="border-t border-line w-full" />
          <span className="bg-[#FAF7F2] px-3 text-[11px] uppercase tracking-wider text-charcoal/40 font-bold shrink-0">
            or continue with
          </span>
          <div className="border-t border-line w-full" />
        </div>

        {/* Google Identity Services Direct Button Container */}
        <div className="w-full flex justify-center items-center min-h-[44px]">
          <div id="google-signup-container" className="flex justify-center w-full max-w-[360px]" />
        </div>

        {/* Visual Royal Fullscreen Authenticating Overlay for Instant Feedback */}
        {isGoogleProcessing && (
          <div className="fixed inset-0 z-[9999] bg-charcoal/85 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full border-3 border-[#D6A23F] border-t-transparent animate-spin mb-4 shadow-[0_0_25px_rgba(214,162,63,0.5)]" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2] tracking-wide mb-1">
              Connecting Royal Account
            </h3>
            <p className="text-xs sm:text-sm text-cream/70 max-w-sm text-center">
              Welcome, Patron. Setting up your Shreekamalinee handloom profile...
            </p>
          </div>
        )}

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
