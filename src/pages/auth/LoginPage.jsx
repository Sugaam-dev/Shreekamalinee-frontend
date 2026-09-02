import { useState, useEffect, useRef } from "react";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { loginSchema } from "../../schemas/authSchemas.js";
import { useLoginMutation, useGoogleAuthMutation } from "../../queries/useAuthQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import EmailQuotaNotice from "../../components/common/EmailQuotaNotice.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserSession } = useAuth();
  const { showToast } = useCart();
  const gisInitialized = useRef(false);

  useSEO({
    title: "Sign In — Shreekamalinee",
    description: "Sign in to access your royal handloom orders, saved addresses, and wishlist.",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);

  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleAuthMutation();

  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handlePasswordLogin = async (data) => {
    setServerError("");
    try {
      const response = await loginMutation.mutateAsync({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      setUserSession(response);
      showToast("Welcome back to Shreekamalinee!", "success");

      const userRole = response.role?.startsWith("ROLE_") ? response.role : `ROLE_${response.role}`;
      if (userRole === "ROLE_ADMIN" || userRole === "ROLE_SUPERADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to sign in. Please verify your email and password.";
      setServerError(msg);
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes("placeholder")) return;

    const setupGoogleSignIn = () => {
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
                showToast("Google sign-in authenticated!", "success");

                const userRole = authResponse.role?.startsWith("ROLE_")
                  ? authResponse.role
                  : `ROLE_${authResponse.role}`;
                if (userRole === "ROLE_ADMIN" || userRole === "ROLE_SUPERADMIN") {
                  navigate("/admin/dashboard", { replace: true });
                } else {
                  navigate(from, { replace: true });
                }
              } catch (err) {
                setIsGoogleProcessing(false);
                const msg =
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  "Google authentication failed. Please try again.";
                showToast(msg, "warning");
              }
            }
          },
        });

        const btnContainer = document.getElementById("google-signin-container");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left",
            width: Math.min(btnContainer.parentElement?.offsetWidth || 340, 360),
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleSignIn();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleSignIn();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleMutation, navigate, setUserSession, showToast, from]);

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your orders, saved addresses, and wishlist"
    >
      <div className="space-y-5">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handlePasswordLogin)} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase font-bold tracking-wider text-charcoal">
                Password *
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-rust hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Enter your password"
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
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={loginMutation.isPending}
            icon={ArrowRight}
          >
            Sign In to Account
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
          <div id="google-signin-container" className="flex justify-center w-full max-w-[360px]" />
        </div>

        {/* Visual Royal Fullscreen Authenticating Overlay for Instant Feedback */}
        {isGoogleProcessing && (
          <div className="fixed inset-0 z-[9999] bg-charcoal/85 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full border-3 border-[#D6A23F] border-t-transparent animate-spin mb-4 shadow-[0_0_25px_rgba(214,162,63,0.5)]" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2] tracking-wide mb-1">
              Authenticating Royal Session
            </h3>
            <p className="text-xs sm:text-sm text-cream/70 max-w-sm text-center">
              Welcome back, Patron. Connecting your Shreekamalinee handloom account...
            </p>
          </div>
        )}

        {/* Footer Registration Link & Email Quota Assistance */}
        <div className="text-center pt-2 text-xs text-charcoal/70">
          <span>New patron to Shreekamalinee? </span>
          <Link
            to="/register"
            className="text-rust font-bold hover:underline"
          >
            Create an Account
          </Link>
        </div>

        {/* Email Limit / OTP Quota Notice & Help Modal */}
        <EmailQuotaNotice showHelpButton={true} className="pt-2 border-t border-line/60" />
      </div>
    </AuthLayout>
  );
}
