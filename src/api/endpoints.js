/**
 * @file Backend API Endpoints Mapping
 * @description Single source of truth for all REST API endpoints matching ShreeKamalinee_Backend Spring Boot controllers.
 */

export const API_ENDPOINTS = {
  // Authentication & Profile (AuthController, ProfileController)
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    GOOGLE_LOGIN: "/auth/google",
    REFRESH_TOKEN: "/auth/refresh-token",
    LOGOUT: "/auth/logout",
    PROFILE: "/auth/profile",
    UPDATE_PROFILE: "/auth/profile/update",
    CHANGE_PASSWORD: "/auth/profile/change-password",
  },

  // Catalog & Products (ProductController)
  PRODUCTS: {
    LIST: "/api/products",
    DETAILS: (id) => `/api/products/${id}`,
    CATEGORIES: "/api/categories",
    SUBCATEGORIES: (category) => `/api/categories/${category}/subcategories`,
    SEARCH: "/api/products/search",
    FEATURED: "/api/products/featured",
    RELATED: (id) => `/api/products/${id}/related`,
    REVIEWS: (id) => `/api/products/${id}/reviews`,
    ADD_REVIEW: (id) => `/api/products/${id}/reviews`,
  },

  // Cart (CartController)
  CART: {
    GET: "/api/cart",
    ADD_ITEM: "/api/cart/items",
    UPDATE_ITEM: (itemId) => `/api/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId) => `/api/cart/items/${itemId}`,
    CLEAR: "/api/cart/clear",
    APPLY_COUPON: "/api/cart/apply-coupon",
    REMOVE_COUPON: "/api/cart/remove-coupon",
  },

  // Wishlist (WishlistController)
  WISHLIST: {
    GET: "/api/wishlist",
    ADD_ITEM: (productId) => `/api/wishlist/items/${productId}`,
    REMOVE_ITEM: (productId) => `/api/wishlist/items/${productId}`,
    MOVE_TO_CART: (productId) => `/api/wishlist/items/${productId}/move-to-cart`,
  },

  // Orders & Payment (OrderController, PaymentController)
  ORDERS: {
    CREATE: "/api/orders/create",
    GET_USER_ORDERS: "/api/orders",
    GET_ORDER_DETAILS: (orderId) => `/api/orders/${orderId}`,
    CANCEL: (orderId) => `/api/orders/${orderId}/cancel`,
    VERIFY_PAYMENT: "/api/payment/razorpay/verify",
    DOWNLOAD_INVOICE: (orderId) => `/api/orders/${orderId}/invoice`,
  },

  // Saved Addresses (AddressController)
  ADDRESSES: {
    LIST: "/api/addresses",
    ADD: "/api/addresses",
    UPDATE: (id) => `/api/addresses/${id}`,
    DELETE: (id) => `/api/addresses/${id}`,
    SET_DEFAULT: (id) => `/api/addresses/${id}/default`,
  },

  // Coupons (AdminCouponController / Storefront)
  COUPONS: {
    VALIDATE: "/api/coupons/validate",
    LIST_ACTIVE: "/api/coupons/active",
  },
};
