import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../../context/CartContext.jsx";
import { ShoppingBag, Heart, Sparkles, X } from "lucide-react";

export default function Toast() {
  const { toast = { show: false, msg: "", type: "info" }, setToast } = useCart();

  if (!toast?.show) return null;

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: -15, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed top-5 left-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[300] max-w-[90vw] w-[350px] pointer-events-auto"
        >
          <div className="relative overflow-hidden bg-charcoal/95 backdrop-blur-md text-cream p-4 rounded-xl border border-mustard/35 shadow-[0_12px_35px_rgba(0,0,0,0.55)] flex items-center gap-3.5">
            {/* Animated Left Accent Gold & Rust Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-mustard via-rust to-mustard" />

            {/* Icon Circle */}
            <div className="w-10 h-10 rounded-full bg-black/50 border border-mustard/35 flex items-center justify-center shrink-0 text-mustard shadow-inner">
              {toast?.type === "wishlist" ? (
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20 animate-pulse" />
              ) : toast?.type === "cart" ? (
                <ShoppingBag className="w-4 h-4 text-mustard" />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-mustard" />
              )}
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-mustard">
                <span>Shreekamalinee</span>
                <span className="w-1 h-1 rounded-full bg-rust" />
                <span className="text-white/60 font-normal">Notice</span>
              </div>
              <p className="text-[13px] font-medium text-cream/95 leading-tight mt-0.5 truncate">
                {toast?.msg || ""}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setToast && setToast((prev) => ({ ...prev, show: false }))}
              className="text-white/40 hover:text-white transition-colors p-1.5 cursor-pointer shrink-0 rounded-full hover:bg-white/10"
              title="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>


            {/* Bottom Shrinking Progress Indicator */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-rust to-mustard"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
