import React from "react";

export default function Button({
  children,
  type = "button",
  variant = "primary", // primary | secondary | outline | ghost | danger
  size = "md",        // sm | md | lg
  isLoading = false,
  loadingText,
  disabled = false,
  className = "",
  onClick,
  icon: Icon,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold tracking-wider uppercase transition-all duration-200 rounded-sm cursor-pointer select-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97] active:brightness-95";

  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-[11px] gap-1.5",
    md: "px-5 py-2.5 text-[12.5px] gap-2",
    lg: "px-7 py-3.5 text-[13px] gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-rust text-white hover:bg-rust-deep shadow-xs hover:shadow-md border border-transparent",
    secondary:
      "bg-charcoal text-cream hover:bg-charcoal/90 shadow-xs hover:shadow-md border border-transparent",
    outline:
      "bg-transparent text-charcoal border border-line hover:border-rust hover:text-rust hover:bg-cream-2/40",
    ghost:
      "bg-transparent text-charcoal/80 hover:text-rust hover:bg-cream-2/50 border border-transparent",
    danger:
      "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 shrink-0" />
          <span>{loadingText || children || "Please wait..."}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === "sm" ? 14 : 16} className="shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
