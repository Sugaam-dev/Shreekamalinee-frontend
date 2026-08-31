/**
 * @file Application Constants
 * @description Centralized constants for routes, order statuses, payment gateways, and filters.
 */

export const ROUTES = {
  HOME: "/",
  SHOP: "/shop",
  PRODUCT: "/product",
  PRODUCT_DETAILS: (id) => `/product/${id}`,
  DETAILS_LEGACY: (id) => `/details/${id}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  CHECKOUT_SUCCESS: "/checkout/success",
  PAYMENT_VERIFY: "/payment",
  
  // Auth Routes
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_OTP: "/verify-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  
  // Customer Account Portal
  ACCOUNT: "/account",
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_ORDERS: "/account/orders",
  ACCOUNT_ORDER_DETAILS: (id) => `/account/orders/${id}`,
  ACCOUNT_ADDRESSES: "/account/addresses",
  ACCOUNT_WISHLIST: "/account/wishlist",
  
  // Informational & Policy Pages
  ABOUT: "/about",
  CONTACT: "/contact",
  FAQ: "/faq",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  SHIPPING_RETURNS: "/shipping-returns",
};

export const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  CONFIRMED: "CONFIRMED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

export const PAYMENT_METHODS = {
  RAZORPAY: { id: "RAZORPAY", label: "Razorpay (Cards, UPI, NetBanking)", icon: "CreditCard" },
  UPI_DIRECT: { id: "UPI_DIRECT", label: "Direct UPI / QR Transfer", icon: "QrCode" },
  COD: { id: "COD", label: "Cash on Delivery (COD)", icon: "Truck" },
};

export const FREE_SHIPPING_THRESHOLD = 1499;
export const STANDARD_SHIPPING_FEE = 99;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

