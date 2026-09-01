import apiClient from "./client.js";

export const couponApi = {
  // 1. Fetch all coupons (Admin)
  getAllCoupons: async () => {
    const response = await apiClient.get("/api/v1/admin/coupons");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.coupons)) return data.coupons;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  // 2. Create coupon (Admin)
  createCoupon: async (couponData) => {
    const response = await apiClient.post("/api/v1/admin/coupons", couponData);
    return response.data;
  },

  // 3. Delete coupon (Admin)
  deleteCoupon: async (id) => {
    const response = await apiClient.delete(`/api/v1/admin/coupons/${id}`);
    return response.data;
  },

  // 3b. Fetch coupon redemption usages (Admin)
  getCouponUsages: async (id) => {
    const response = await apiClient.get(`/api/v1/admin/coupons/${id}/usages`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // 4. Fetch public active coupons (Customer / Checkout)
  getActiveCoupons: async () => {
    const response = await apiClient.get("/api/v1/orders/coupons");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.coupons)) return data.coupons;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  // 5. Validate coupon code (Checkout)
  validateCoupon: async (code, amount) => {
    const response = await apiClient.get(`/api/v1/orders/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${amount || 0}`);
    return response.data;
  },
};


export default couponApi;
