import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { loginSchema } from "../../schemas/authSchemas.js";
import { useLoginMutation } from "../../queries/useAuthQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserSession } = useAuth();
  const { showToast } = useCart();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const loginMutation = useLoginMutation();

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

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const response = await loginMutation.mutateAsync(data);
      const userRole = response.role?.startsWith("ROLE_") ? response.role : `ROLE_${response.role}`;
      if (userRole !== "ROLE_ADMIN" && userRole !== "ROLE_SUPERADMIN") {
        setServerError("Access denied: Your account does not have administrator privileges.");
        return;
      }

      setUserSession(response);
      showToast("Administrator authenticated successfully!", "success");

      const redirectPath = location.state?.from?.pathname || "/admin/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid credentials or server connection error.";
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Royal Texture Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#800020]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#800020] text-[#B8860B] flex items-center justify-center mx-auto mb-3 border-2 border-[#B8860B] shadow-md">
            <Sparkles size={26} />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#800020] tracking-wide">
            SHREE KAMALINEE
          </h1>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B8860B] font-bold block mt-1">
            Executive Admin Portal
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-sm p-8 shadow-xl space-y-6">
          <div className="border-b border-[#E5E7EB] pb-3">
            <h2 className="font-serif font-bold text-lg text-[#212529]">
              Admin Authentication
            </h2>
            <p className="text-xs text-[#212529]/60">
              Sign in with your authorized store credentials to manage the platform.
            </p>
          </div>

          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-[#212529] mb-1.5">
                Admin Email Address *
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#212529]/40" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Enter administrator email"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.email ? "border-rose-500 focus:border-rose-500" : "border-[#E5E7EB] focus:border-[#800020]"
                  }`}
                />
              </div>
              {errors.email && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-[#212529] mb-1.5">
                Admin Password *
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#212529]/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.password ? "border-rose-500 focus:border-rose-500" : "border-[#E5E7EB] focus:border-[#800020]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#212529]/40 hover:text-[#212529] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-[#800020] hover:bg-[#66001a] text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              <span>{loginMutation.isPending ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#212529]/60">
            <Link to="/" className="hover:text-[#800020] transition-colors">
              ← Return to Live Storefront
            </Link>
            <span className="flex items-center gap-1 text-[10.5px]">
              <ShieldCheck size={13} className="text-[#B8860B]" />
              <span>Spring Boot JWT Secured</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
