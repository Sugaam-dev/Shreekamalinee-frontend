import React, { useState } from "react";
import { AlertCircle, HelpCircle, X, ShieldAlert, Sparkles, Clock, CheckCircle } from "lucide-react";
import { useEmailServiceStatusQuery } from "../../queries/useAuthQueries.js";

/**
 * Renders an automatic alert banner if the daily email quota is reached,
 * plus a helpful "Didn't receive email/OTP?" help button and explanation modal.
 */
export default function EmailQuotaNotice({ className = "" }) {
  const { data: status } = useEmailServiceStatusQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isExceeded = status?.dailyQuotaExceeded === true;

  // 🛡️ When quota is NOT exceeded, return null (100% clean UI, no buttons/banners)
  if (!isExceeded) {
    return null;
  }

  return (
    <div className={`space-y-2.5 animate-in fade-in duration-300 ${className}`}>
      {/* ⚠️ Warning Banner & Button shown ONLY when daily quota is expired */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xs p-3.5 text-xs flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-amber-950">
              Daily Email Verification Limit Reached
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-[11px] text-[#800020] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <HelpCircle size={12} />
              <span>What to do?</span>
            </button>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            Automated email OTP delivery is paused for today. Please click{" "}
            <span className="font-bold underline text-amber-950">
              Continue with Google
            </span>{" "}
            for instant 1-click access without needing any email code.
          </p>
        </div>
      </div>

      {/* ℹ️ Detailed Information Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xs max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#800020]/10 text-[#800020] flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Email & OTP Verification Help
                </h3>
                <p className="text-xs text-gray-500">
                  Having trouble receiving your verification code?
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-3 bg-gray-50 p-4 rounded-xs border border-gray-100 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Check Spam / Junk folder:</strong> Verification emails sometimes arrive in Spam or Promotions folders.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-[#800020] shrink-0 mt-0.5" />
                <span>
                  <strong>Instant 1-Click Access:</strong> If OTP delivery is delayed or daily free email limits have been reached, click <strong>"Continue with Google"</strong> to sign in or register immediately without any email OTP code.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Clock size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Daily Limit Reset:</strong> Our automated email services refresh every midnight (12:00 AM UTC). If you require email OTP for password recovery, please retry tomorrow once quota resets.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#800020] hover:bg-[#600018] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs"
              >
                Got it, thank you
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
