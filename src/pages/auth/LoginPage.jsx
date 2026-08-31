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

  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleAuthMutation();

  const from = location.state?.from?.pathname || "/account/profile";

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
      showToast("Welcome back to Shree Kamalinee!", "success");

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
          callback: async (response) => {
            if (response?.credential) {
              try {
                showToast("Verifying with Google...", "info");
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
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: btnContainer.offsetWidth || 340,
            text: "signin_with",
            shape: "rectangular",
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

  const handleGoogleLogin = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = document.querySelector("#google-signin-container div[role=button]");
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
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-charcoal/40 font-bold shrink-0">
            or continue with
          </span>
          <div className="border-t border-line w-full" />
        </div>

        {/* Single Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleMutation.isPending}
          className="w-full py-2.5 px-4 border border-line hover:border-charcoal/40 rounded-xs text-xs font-semibold text-charcoal bg-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-rust border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleMutation.isPending ? "Authenticating..." : "Sign In with Google"}</span>
        </button>

        {/* Footer Registration Link */}
        <div className="text-center pt-2 text-xs text-charcoal/70">
          <span>New patron to Shree Kamalinee? </span>
          <Link
            to="/register"
            className="text-rust font-bold hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
