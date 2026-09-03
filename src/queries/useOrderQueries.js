import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import orderApi from "../api/orderApi.js";

export const ORDER_KEYS = {
  all: ["orders"],
  adminList: ["orders", "admin"],
  adminDetail: (id) => ["orders", "admin", id],
  adminStats: ["orders", "admin", "stats"],
  userList: ["orders", "user"],
  userDetail: (id) => ["orders", "user", id],
};

// 1. Fetch All Admin Orders
export function useAdminOrdersQuery() {
  return useQuery({
    queryKey: ORDER_KEYS.adminList,
    queryFn: orderApi.getAllOrdersAdmin,
    staleTime: 1000 * 5, // 5 seconds for real-time order feed
    refetchInterval: 10000, // 10s live background poll
    refetchOnWindowFocus: true,
  });
}

// 2. Fetch Single Admin Order Details
export function useAdminOrderDetailQuery(orderId) {
  return useQuery({
    queryKey: ORDER_KEYS.adminDetail(orderId),
    queryFn: () => orderApi.getOrderByIdAdmin(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 5,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}

// 3. Fetch Admin Dashboard Stats & KPIs
export function useAdminDashboardStatsQuery() {
  return useQuery({
    queryKey: ORDER_KEYS.adminStats,
    queryFn: orderApi.getAdminDashboardStats,
    staleTime: 1000 * 5,
    refetchInterval: 12000, // 12s live KPI sync
    refetchOnWindowFocus: true,
  });
}

// 4. Update Order Lifecycle Status Mutation (status changes only)
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, updateData }) =>
      orderApi.updateOrderStatusAdmin(orderId, updateData),
    onSuccess: (updatedOrder, { orderId }) => {
      queryClient.setQueryData(ORDER_KEYS.adminDetail(orderId), updatedOrder);
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// 4b. Update Courier / Shipping / Tracking Details Mutation (separate from status)
export function useUpdateShippingDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, shippingData }) =>
      orderApi.updateShippingDetailsAdmin(orderId, shippingData),
    onSuccess: (updatedOrder, { orderId }) => {
      queryClient.setQueryData(ORDER_KEYS.adminDetail(orderId), updatedOrder);
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userDetail(orderId) });
    },
  });
}

// 5. Approve Manual UPI Payment Mutation
export function useApproveManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => orderApi.approveManualPayment(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// 6. Reject Manual UPI Payment Mutation
export function useRejectManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => orderApi.rejectManualPayment(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      // Invalidate products to immediately restore refunded stock count
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// 6b. Admin Manual / WhatsApp Order Booking Mutation
export function useCreateAdminManualOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => orderApi.createAdminManualOrder(payload),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

// 7. Customer Storefront User Orders Query (Supports pagination)
export function useUserOrdersQuery(params = { page: 0, size: 10 }) {
  return useQuery({
    queryKey: ["orders", "user", params],
    queryFn: () => orderApi.getUserOrders(params),
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 10000, // 10s auto-refresh for order status
    refetchOnWindowFocus: true,
  });
}

// 8. Customer Storefront User Single Order Query
export function useUserOrderDetailQuery(orderId) {
  return useQuery({
    queryKey: ORDER_KEYS.userDetail(orderId),
    queryFn: () => orderApi.getUserOrderById(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 5,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}

// 9. Fetch Store Bank Details & QR Code
export function useBankDetailsQuery() {
  return useQuery({
    queryKey: ["orders", "bank-details"],
    queryFn: orderApi.getBankDetails,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

// 10. Place Customer Order Mutation
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderData, idempotencyKey }) =>
      orderApi.createOrder(orderData, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Instantly deduct product stock across all product & shop views
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// 11. Razorpay Payment Mutation
export function useCreateRazorpayOrderMutation() {
  return useMutation({
    mutationFn: (orderId) => orderApi.createRazorpayOrder(orderId),
  });
}

// 12. Verify Razorpay Payment Mutation
export function useVerifyRazorpayPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (verificationData) => orderApi.verifyRazorpayPayment(verificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// 13. Submit Manual UPI Receipt Mutation
export function useSubmitManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, formData }) =>
      orderApi.submitManualPayment(orderId, formData),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.userList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminList });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminStats });
    },
  });
}

