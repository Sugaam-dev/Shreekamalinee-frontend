import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowRight, RotateCw, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { useVerifyOtpMutation } from "../../queries/useAuthQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import EmailQuotaNotice from "../../components/common/EmailQuotaNotice.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserSession } = useAuth();
  const { showToast } = useCart();

  // Read locked target email strictly from router state or query parameter
  const targetEmail = location.state?.email || searchParams.get("email") || "";

  useSEO({
    title: "Verify Account OTP — Shreekamalinee",
    description: "Verify your email with a 6-digit one-time password.",
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [serverError, setServerError] = useState("");
  const inputRefs = useRef([]);

  const verifyOtpMutation = useVerifyOtpMutation();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!targetEmail) {
      setServerError("No email address provided. Please return to the registration page.");
      return;
    }

    const otpCode = otp.join("");
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setServerError("Please enter the complete 6-digit numeric OTP.");
      return;
    }

    setServerError("");
    try {
      const response = await verifyOtpMutation.mutateAsync({
        email: targetEmail.trim().toLowerCase(),
        otp: otpCode,
      });

      setUserSession(response);
      showToast("Patron account verified successfully! Welcome to Shreekamalinee.", "success");
      navigate("/account/profile", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid or expired OTP. Please verify the code and try again.";
      setServerError(msg);
    }
  };

  const handleResend = () => {
    if (!targetEmail) {
      showToast("No destination email found", "warning");
      return;
    }
    setTimer(45);
    setOtp(["", "", "", "", "", ""]);
    showToast(`New verification code sent to ${targetEmail}`, "info");
  };

  return (
    <AuthLayout
      title="Verify Account Email"
      subtitle="Enter the 6-digit authentication code sent to your inbox"
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Read-Only Locked Email Badge with Change Email link */}
        <div className="bg-gray-50 border border-gray-200 rounded-xs p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Mail size={14} className="text-[#800020] shrink-0" />
            <span className="font-bold text-gray-800 truncate font-mono">
              {targetEmail || "No email specified"}
            </span>
          </div>
          <Link
            to="/register"
            className="text-[11px] text-[#800020] font-bold hover:underline shrink-0 ml-2"
          >
            Wrong Email?
          </Link>
        </div>

        {/* 6-Digit OTP Input Grid */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-2">
            6-Digit Security Code *
          </label>
          <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold font-mono border border-line rounded-xs bg-white outline-none focus:border-rust focus:ring-2 focus:ring-rust/20 transition-all text-charcoal shadow-xs"
                autoFocus={idx === 0}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={verifyOtpMutation.isPending}
          icon={ArrowRight}
        >
          Verify & Complete Registration
        </Button>

        {/* Resend OTP Timer & Email Quota Assistance */}
        <div className="text-center text-xs text-charcoal/70">
          {timer > 0 ? (
            <span>Resend code in <strong className="text-rust font-mono">{timer}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-rust font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCw size={12} />
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>

        {/* Email Limit & Quota Help Notice */}
        <EmailQuotaNotice showHelpButton={true} className="pt-2" />

        <div className="text-center pt-2 border-t border-line text-xs">
          <Link
            to="/register"
            className="text-charcoal/70 hover:text-rust font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to Registration</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
