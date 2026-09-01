import apiClient from "./client.js";

export const orderApi = {
  // --- ADMIN ORDER MANAGEMENT ---

  // 1. Fetch all orders (Admin)
  getAllOrdersAdmin: async (params = {}) => {
    const response = await apiClient.get("/api/v1/admin/orders", { params });
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  // 2. Fetch single order details (Admin)
  getOrderByIdAdmin: async (orderId) => {
    const response = await apiClient.get(`/api/v1/admin/orders/${orderId}`);
    return response.data;
  },

  // 3. Fetch Admin Dashboard KPIs & Stats
  getAdminDashboardStats: async () => {
    const response = await apiClient.get("/api/v1/admin/orders/dashboard/stats");
    return response.data;
  },

  // 4. Update Order Lifecycle Status only (CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  updateOrderStatusAdmin: async (orderId, updateData) => {
    const response = await apiClient.put(`/api/v1/admin/orders/${orderId}/status`, updateData);
    return response.data;
  },

  // 4b. Update Courier / Shipping / Tracking Details only — separate from status
  updateShippingDetailsAdmin: async (orderId, shippingData) => {
    const response = await apiClient.put(`/api/v1/admin/orders/${orderId}/shipping`, shippingData);
    return response.data;
  },

  // 5. Approve Manual UPI Payment Proof (Admin)
  approveManualPayment: async (orderId) => {
    const response = await apiClient.post(`/api/v1/admin/orders/${orderId}/approve`);
    return response.data;
  },

  // 6. Reject Manual UPI Payment Proof (Admin)
  rejectManualPayment: async (orderId) => {
    const response = await apiClient.post(`/api/v1/admin/orders/${orderId}/reject`);
    return response.data;
  },

  // 6b. Book WhatsApp / Manual Order (Admin)
  createAdminManualOrder: async (payload) => {
    const response = await apiClient.post("/api/v1/admin/orders/manual", payload);
    return response.data;
  },

  // 7. Get Manual Payment Receipt Preview URL (Admin)
  getPaymentReceiptUrl: (orderId) => {
    return `${apiClient.defaults.baseURL || ""}/api/v1/admin/orders/${orderId}/receipt`;
  },

  // 8. Fetch Store Bank Details & QR Code for UPI Manual Payment
  getBankDetails: async () => {
    try {
      const response = await apiClient.get("/api/v1/orders/bank-details");
      return response.data;
    } catch {
      const response = await apiClient.get("/api/v1/settings/public");
      return response.data;
    }
  },

  // --- CUSTOMER ORDER STOREFRONT ---

  // 8. Fetch logged-in user orders
  getUserOrders: async () => {
    const response = await apiClient.get("/api/v1/orders");
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  // 9. Fetch user order by ID
  getUserOrderById: async (orderId) => {
    const response = await apiClient.get(`/api/v1/orders/${orderId}`);
    return response.data;
  },

  // 10. Customer Order Placement Flow
  createOrder: async (orderPayload, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const response = await apiClient.post("/api/v1/orders/checkout", orderPayload, { headers });
    return response.data;
  },

  createRazorpayOrder: async (orderPayload) => {
    const response = await apiClient.post("/api/v1/orders/razorpay/create", orderPayload);
    return response.data;
  },

  verifyRazorpayPayment: async (verificationPayload) => {
    const response = await apiClient.post("/api/v1/orders/razorpay/verify", verificationPayload);
    return response.data;
  },

  submitManualPayment: async (orderId, formData) => {
    const response = await apiClient.post(`/api/v1/orders/${orderId}/manual`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  createManualOrder: async (formData) => {
    const response = await apiClient.post("/api/v1/orders/manual/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  createCodOrder: async (orderPayload) => {
    const response = await apiClient.post("/api/v1/orders/cod/create", orderPayload);
    return response.data;
  },

  cancelUserOrder: async (orderId, reason) => {
    const response = await apiClient.post(`/api/v1/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
};

export default orderApi;