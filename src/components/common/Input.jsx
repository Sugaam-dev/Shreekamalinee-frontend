import React from "react";

export default function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={`w-full flex flex-col ${className}`}>
      {label && (
        <label className="text-[11.5px] uppercase tracking-wider text-charcoal/70 mb-1.5 font-medium flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rust">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-charcoal/40 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full text-sm bg-white border outline-none rounded-sm transition-all duration-200 text-charcoal placeholder:text-charcoal/35 ${
            Icon ? "pl-10 pr-3.5 py-2.5" : "px-3.5 py-2.5"
          } ${
            error
              ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              : "border-line focus:border-rust focus:ring-1 focus:ring-rust/20"
          } ${disabled ? "bg-cream-2/60 cursor-not-allowed opacity-75" : ""} ${inputClassName}`}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-[11px] text-rose-600 font-medium mt-1 animate-fadeIn">
          {error}
        </span>
      ) : helperText ? (
        <span className="text-[11px] text-charcoal/50 mt-1">{helperText}</span>
      ) : null}
    </div>
  );
}
