import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  Receipt,
  Plus,
  MessageCircle,
  Tag,
  ShoppingBag,
  UserCheck,
  Sparkles,
  ShieldCheck,
  CreditCard,
  User,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { orderStatusUpdateSchema } from "../../schemas/orderSchemas.js";
import {
  useAdminOrdersQuery,
  useAdminDashboardStatsQuery,
  useUpdateOrderStatusMutation,
  useApproveManualPaymentMutation,
  useRejectManualPaymentMutation,
  useCreateAdminManualOrderMutation,
} from "../../queries/useOrderQueries.js";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCustomersQuery } from "../../queries/useCustomerQueries.js";
import couponApi from "../../api/couponApi.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { TableRowSkeleton } from "../../components/common/Skeleton.jsx";

export default function AdminOrdersPage() {
  const { showToast } = useCart();
  const [searchParams] = useSearchParams();

  const { data: orders = [], isLoading: isOrdersLoading } = useAdminOrdersQuery();
  const { data: stats } = useAdminDashboardStatsQuery();

  const updateStatusMutation = useUpdateOrderStatusMutation();
  const approvePaymentMutation = useApproveManualPaymentMutation();
  const rejectPaymentMutation = useRejectManualPaymentMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const urlStatus = searchParams.get("status") || searchParams.get("paymentStatus") || "all";
  const [statusFilter, setStatusFilter] = useState(urlStatus);

  useEffect(() => {
    const qStatus = searchParams.get("status") || searchParams.get("paymentStatus");
    if (qStatus) setStatusFilter(qStatus);
  }, [searchParams]);

  // Modals state
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [shippingModalOrder, setShippingModalOrder] = useState(null);

  // Status & Tracking Form
  const isAuditingPayment = approvePaymentMutation.isPending || rejectPaymentMutation.isPending;

  const {
    register: registerShipping,
    handleSubmit: handleShippingSubmit,
    reset: resetShipping,
    watch: watchShipping,
    formState: { errors: shippingErrors, isSubmitting: isSubmittingShipping },
  } = useForm({
    resolver: zodResolver(orderStatusUpdateSchema),
  });

  const selectedShippingStatus = watchShipping("status");
  const isUpdatingStatus = updateStatusMutation.isPending || isSubmittingShipping;

  const handleOpenShippingModal = (order) => {
    setShippingModalOrder(order);
    let edd = "";
    if (order.estimatedDeliveryDate) {
      edd = String(order.estimatedDeliveryDate).slice(0, 10);
    }
    resetShipping({
      status: order.status || order.orderStatus || "PROCESSING",
      courierName: order.courierPartner || order.courierName || "Blue Dart Express",
      trackingNumber: order.trackingNumber || "",
      trackingUrl: order.trackingUrl || "",
      estimatedDeliveryDate: edd,
      cancellationReason: order.cancellationReason || "",
    });
  };

  const onShippingSubmit = async (data) => {
    if (!shippingModalOrder) return;
    try {
      const payload = {
        status: data.status,
        courierPartner: data.courierName,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        cancellationReason: data.cancellationReason,
      };
      await updateStatusMutation.mutateAsync({
        orderId: shippingModalOrder.id,
        updateData: payload,
      });
      showToast(`Order status updated to ${data.status}`, "success");
      setShippingModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update order status", "warning");
    }
  };

  const handleApprovePayment = async (orderId) => {
    try {
      await approvePaymentMutation.mutateAsync(orderId);
      showToast("Manual payment verified! Order marked as PAID.", "success");
      setReceiptModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payment", "warning");
    }
  };

  const handleRejectPayment = async (orderId) => {
    try {
      await rejectPaymentMutation.mutateAsync(orderId);
      showToast("Manual payment rejected. Stock returned to inventory.", "info");
      setReceiptModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject payment", "warning");
    }
  };

  // Safe Normalized Order List
  const orderList = useMemo(() => {
    return Array.isArray(orders) ? orders : Array.isArray(orders?.content) ? orders.content : [];
  }, [orders]);

  // Filter & Sort Orders (Latest Orders on Top)
  const filteredOrders = useMemo(() => {
    return orderList
      .filter((order) => {
        const matchesSearch =
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.couponCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.utrNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === "MANUAL_PENDING") {
          return matchesSearch && (order.paymentMethod === "MANUAL" || order.paymentMethod === "DIRECT_UPI") && order.paymentStatus === "PENDING";
        }
        if (statusFilter === "PAID") {
          return matchesSearch && order.paymentStatus === "PAID";
        }
        if (statusFilter === "COD") {
          return matchesSearch && order.paymentMethod === "COD";
        }
        if (statusFilter !== "all") {
          const currentStatus = order.status || order.orderStatus;
          return matchesSearch && (currentStatus === statusFilter || order.paymentStatus === statusFilter);
        }
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [orderList, searchTerm, statusFilter]);

  const pendingManualCount = orderList.filter(
    (o) => o.paymentMethod === "MANUAL" && o.paymentStatus === "PENDING"
  ).length;

  return (
    <AdminLayout
      title="Orders & Manual Payment Audits"
      subtitle="Verify customer payments, audit manual UPI screenshot proofs, and dispatch courier tracking numbers"
      actions={
        <Link to="/admin/orders/new">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            className="shadow-sm font-semibold cursor-pointer"
          >
            Book WhatsApp / Offline Order
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KPI Banner Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-1">
              {stats?.totalOrders ?? orderList.length}
            </div>
            <span className="text-[11px] text-gray-400">All lifetime orders</span>
          </div>

          <div className="bg-white p-4 rounded-xs border border-amber-200 bg-amber-50/40 shadow-xs">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Pending UPI Audits
            </span>
            <div className="font-serif font-bold text-2xl text-amber-900 mt-1">
              {pendingManualCount}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Requires proof verification</span>
          </div>

          <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Processing & In Dispatch
            </span>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-1">
              {orderList.filter((o) => {
                const s = o.status || o.orderStatus;
                return s === "PROCESSING" || s === "SHIPPED";
              }).length}
            </div>
            <span className="text-[11px] text-blue-700">Active fulfillment</span>
          </div>

          <div className="bg-white p-4 rounded-xs border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Delivered Successfully
            </span>
            <div className="font-serif font-bold text-2xl text-emerald-900 mt-1">
              {orderList.filter((o) => (o.status || o.orderStatus) === "DELIVERED").length}
            </div>
            <span className="text-[11px] text-emerald-700">Completed deliveries</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID, Customer, Tracking No..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-gray-50 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "all" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({orders.length})
              </button>
              {pendingManualCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("MANUAL_PENDING")}
                  className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                    statusFilter === "MANUAL_PENDING"
                      ? "bg-amber-600 text-white"
                      : "text-amber-800 bg-amber-100 hover:bg-amber-200"
                  }`}
                >
                  ⚡ Audit UPI Proofs ({pendingManualCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setStatusFilter("PLACED")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "PLACED" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Placed
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PROCESSING")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "PROCESSING" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Processing
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("SHIPPED")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "SHIPPED" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Shipped
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DELIVERED")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "DELIVERED" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Delivered
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "CANCELLED" ? "bg-rose-700 text-white" : "text-rose-700 hover:bg-rose-50"
                }`}
              >
                Cancelled
              </button>
            </div>

          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer & Address</th>
                  <th className="py-3.5 px-4">Payment Method & Status</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Courier Tracking</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isOrdersLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-gray-900 hover:text-[#800020] transition-colors"
                        >
                          {order.orderNumber || `#${order.id?.slice(0, 8).toUpperCase()}`}
                        </Link>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>

                      {/* Customer & Shipping */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-gray-900">
                          {order.shippingAddress?.fullName || "Patron Customer"}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.postalCode})
                        </div>
                      </td>

                      {/* Payment Status & Manual Audit Action */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10.5px] font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {order.paymentStatus || "PENDING"}
                          </span>
                          <span className="text-[11px] font-mono text-gray-600">
                            ({order.paymentMethod || "ONLINE"})
                          </span>
                        </div>

                        {/* UTR Reference ID if present */}
                        {order.utrNumber && (
                          <div className="mt-1 text-[11px] text-gray-600">
                            UTR: <strong className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded-xs select-all">{order.utrNumber}</strong>
                          </div>
                        )}

                        {/* Audit Proof Trigger for Manual UPI */}
                        {order.paymentMethod === "MANUAL" && order.paymentStatus === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => setReceiptModalOrder(order)}
                            className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xs text-[10.5px] font-bold cursor-pointer transition-colors"
                          >
                            <Receipt size={12} />
                            <span>Audit Receipt & UTR</span>
                          </button>
                        )}
                      </td>

                      {/* Order Lifecycle Status */}
                      <td className="py-3 px-4">
                        {(() => {
                          const s = order.status || order.orderStatus || "PLACED";
                          return (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                s === "DELIVERED"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : s === "SHIPPED"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : s === "PROCESSING"
                                  ? "bg-purple-50 text-purple-800 border border-purple-200"
                                  : s === "CANCELLED"
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : "bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                            >
                              {s}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(
                            order.finalAmount != null
                              ? order.finalAmount
                              : Number(order.totalAmount || 0) - Number(order.discountAmount || 0) + Number(order.shippingFee || 0) + Number(order.codHandlingFee || 0)
                          )}
                        </div>
                        {Number(order.discountAmount) > 0 && (
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            Saved {formatCurrency(order.discountAmount)}
                          </div>
                        )}
                      </td>

                      {/* Courier & Tracking */}
                      <td className="py-3 px-4">
                        {order.trackingNumber || order.courierName ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-gray-800 text-[11px] block">
                              {order.courierName || "Courier Partner"}
                            </span>
                            {order.trackingNumber ? (
                              <div className="font-mono text-[11px] text-[#800020] font-bold bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-xs inline-block select-all">
                                {order.trackingNumber}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[10.5px] italic">No tracking no.</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Not dispatched</span>
                        )}
                      </td>



                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenShippingModal(order)}
                            className="p-1.5 text-gray-600 hover:text-[#800020] hover:bg-gray-100 rounded-xs cursor-pointer transition-colors"
                            title="Update Status & Tracking"
                          >
                            <Truck size={15} />
                          </button>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="p-1.5 text-gray-600 hover:text-[#800020] hover:bg-gray-100 rounded-xs transition-colors"
                            title="View Full Order Details"
                          >
                            <Eye size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Payment Receipt Audit Modal */}
        <Modal
          isOpen={!!receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
          title={`Audit Manual UPI Payment: ${receiptModalOrder?.orderNumber || `#${receiptModalOrder?.id?.slice(0, 8).toUpperCase()}`}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xs text-amber-900 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                <span className="font-bold">Transaction Reference / UTR:</span>
                <span className="font-mono text-xs bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-xs select-all">
                  {receiptModalOrder?.utrNumber || "No UTR Provided"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div>
                  <span className="text-amber-700/80 block">Customer:</span>
                  <strong className="text-amber-950 font-bold">{receiptModalOrder?.shippingAddress?.fullName || receiptModalOrder?.userName || "Customer"}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Phone:</span>
                  <strong className="text-amber-950 font-mono">{receiptModalOrder?.shippingAddress?.phoneNumber || receiptModalOrder?.userPhone || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Total Amount:</span>
                  <strong className="text-amber-950 font-bold text-xs">{formatCurrency(receiptModalOrder?.totalAmount)}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Order Status:</span>
                  <strong className="text-amber-950 uppercase">{receiptModalOrder?.orderStatus}</strong>
                </div>
              </div>
            </div>

            {/* Receipt Image Viewer */}
            <div className="border border-gray-200 rounded-xs overflow-hidden bg-gray-100 min-h-[220px] flex flex-col items-center justify-center p-2">
              {receiptModalOrder?.paymentProofUrl ? (
                <a
                  href={receiptModalOrder.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block text-center"
                  title="Click to open full size screenshot in new tab"
                >
                  <img
                    src={receiptModalOrder.paymentProofUrl}
                    alt="UPI Payment Screenshot"
                    className="max-h-80 w-auto rounded-xs object-contain group-hover:opacity-90 transition-opacity"
                  />
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-amber-800 font-bold group-hover:underline">
                    <ExternalLink size={12} />
                    <span>Open High-Resolution Screenshot</span>
                  </div>
                </a>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <Receipt size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-xs">No screenshot image attached to this order.</p>
                  <p className="text-[11px] text-gray-400">Customer submitted UTR only: {receiptModalOrder?.utrNumber || "N/A"}</p>
                </div>
              )}
            </div>

            {/* Decision Controls */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <Button
                type="button"
                variant="danger"
                size="md"
                icon={XCircle}
                disabled={isAuditingPayment}
                isLoading={rejectPaymentMutation.isPending}
                onClick={() => handleRejectPayment(receiptModalOrder.id)}
              >
                {rejectPaymentMutation.isPending ? "Rejecting..." : "Reject & Restock"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={CheckCircle2}
                disabled={isAuditingPayment}
                isLoading={approvePaymentMutation.isPending}
                onClick={() => handleApprovePayment(receiptModalOrder.id)}
              >
                {approvePaymentMutation.isPending ? "Approving..." : "Approve & Mark Paid"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Update Status & Tracking Modal */}
        <Modal
          isOpen={!!shippingModalOrder}
          onClose={() => setShippingModalOrder(null)}
          title={`Update Order: ${shippingModalOrder?.orderNumber || `#${shippingModalOrder?.id?.slice(0, 8).toUpperCase()}`}`}
          size="md"
        >
          <form onSubmit={handleShippingSubmit(onShippingSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Order Lifecycle Status *
              </label>
              <select
                {...registerShipping("status")}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              >
                <option value="PLACED">PLACED (Order Received)</option>
                <option value="PROCESSING">PROCESSING (Packaging & Ready)</option>
                <option value="SHIPPED">SHIPPED (In Transit)</option>
                <option value="DELIVERED">DELIVERED (Handed Over)</option>
                <option value="CANCELLED">CANCELLED (Refunded / Restocked)</option>
              </select>
            </div>

            {selectedShippingStatus === "CANCELLED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs space-y-1">
                <label className="block text-xs uppercase font-bold tracking-wider text-rose-800">
                  Cancellation Reason (Visible to Customer) *
                </label>
                <textarea
                  {...registerShipping("cancellationReason")}
                  rows={2}
                  placeholder="e.g. Payment proof unverified, customer requested cancellation, or item out of stock"
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xs outline-none focus:border-rose-700 bg-white font-medium text-rose-950"
                />
                <span className="text-[10.5px] text-rose-700 block">
                  ⚠️ This reason will be displayed on the customer's Order Details page and inventory stock will automatically be returned.
                </span>
              </div>
            )}


            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Courier / Postal Partner Name
                </label>
                <input
                  type="text"
                  {...registerShipping("courierName")}
                  placeholder="e.g. India Post Speed Post, Blue Dart, DTDC"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Postal Consignment / Tracking No.
                </label>
                <input
                  type="text"
                  {...registerShipping("trackingNumber")}
                  placeholder="e.g. EB891238910IN, BLUEDART-889102"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                {...registerShipping("estimatedDeliveryDate")}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
              <span className="text-[10.5px] text-gray-500 mt-1 block">
                💡 The patron will see the Postal Tracking Number on their order page with a 1-click copy button.
              </span>
            </div>


            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isUpdatingStatus}
                onClick={() => setShippingModalOrder(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isUpdatingStatus}
                isLoading={isUpdatingStatus}
              >
                {isUpdatingStatus ? "Saving Changes..." : "Save Tracking & Status"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
