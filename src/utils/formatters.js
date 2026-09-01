/**
 * @file Formatters Utility
 * @description Helpers for currency formatting (₹), dates, status styling, and string manipulation.
 */

/**
 * Format a number as Indian Rupee (₹) currency string.
 * @param {number} amount
 * @returns {string} e.g. "₹2,499"
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/**
 * Format ISO date string into readable Indian date format.
 * @param {string|Date} dateStr
 * @returns {string} e.g. "26 Aug 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date with time.
 * @param {string|Date} dateStr
 * @returns {string} e.g. "26 Aug 2026, 04:30 PM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get visual badge colors based on order status.
 * @param {string} status
 * @returns {{ bg: string, text: string, border: string }}
 */
export function getOrderStatusBadge(status) {
  switch (status) {
    case "DELIVERED":
      return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Delivered" };
    case "SHIPPED":
      return { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "Shipped" };
    case "OUT_FOR_DELIVERY":
      return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Out for Delivery" };
    case "CONFIRMED":
    case "PROCESSING":
      return { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Processing" };
    case "CANCELLED":
    case "REFUNDED":
      return { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled" };
    default:
      return { bg: "bg-stone-50 text-stone-700 border-stone-200", label: status || "Pending" };
  }
}

/**
 * Format payment method code into clean, readable label.
 * @param {string} method
 * @returns {string}
 */
export function formatPaymentMethod(method) {
  if (!method) return "Manual Payment";
  const m = String(method).toUpperCase();
  if (m === "RAZORPAY" || m === "ONLINE") return "Razorpay Online";
  if (m === "COD") return "Cash on Delivery (COD)";
  if (m === "MANUAL" || m === "UPI" || m === "BANK_TRANSFER") return "UPI / Bank Transfer";
  return method;
}

/**
 * Truncate long text with ellipsis.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 60) {
  if (!str) return "";
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
}
