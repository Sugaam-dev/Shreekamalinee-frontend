import React from "react";

export default function Badge({
  children,
  variant = "default", // default | success | warning | danger | info | gold
  size = "sm",         // sm | md
  className = "",
}) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 tracking-wider",
    md: "text-[11px] px-2.5 py-1 tracking-widest",
  };

  const variantClasses = {
    default: "bg-cream-2 text-charcoal/80 border-line",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    gold: "bg-amber-500/10 text-amber-800 border-amber-300 font-serif",
  };

  return (
    <span
      className={`inline-flex items-center uppercase font-bold border rounded-xs ${
        sizeClasses[size] || sizeClasses.sm
      } ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </span>
  );
}
