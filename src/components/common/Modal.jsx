import { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_MAP = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  full: "max-w-6xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size,
  maxWidth,
  showClose = true,
}) {
  const computedMaxWidth = maxWidth || (size && SIZE_MAP[size]) || "max-w-lg";
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${computedMaxWidth} bg-[#FAF7F2] rounded-sm border border-line shadow-2xl z-10 overflow-hidden animate-fadeIn my-8`}
      >
        {/* Top Accent Line */}
        <div className="h-1 bg-gradient-to-r from-rust via-[#D6A23F] to-rust w-full" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-line">
          <div>
            {title && <h3 className="font-serif text-xl font-bold text-charcoal">{title}</h3>}
            {subtitle && <p className="text-xs text-charcoal/60 mt-0.5">{subtitle}</p>}
          </div>

          {showClose && (
            <button
              onClick={onClose}
              className="text-charcoal/50 hover:text-rust p-1 rounded-full hover:bg-cream-2 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
