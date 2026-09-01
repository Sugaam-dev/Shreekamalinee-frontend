import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  Receipt,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import {
  useAdminOrdersQuery,
  useAdminDashboardStatsQuery,
  useUpdateOrderStatusMutation,
  useUpdateShippingDetailsMutation,
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

// Helper: badge class for any order status
function statusBadgeClass(s) {
  if (s === "DELIVERED") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "SHIPPED") return "bg-blue-50 text-blue-800 border-blue-200";
  if (s === "PROCESSING") return "bg-purple-50 text-purple-800 border-purple-200";
  if (s === "CONFIRMED") return "bg-indigo-50 text-indigo-800 border-indigo-200";
  if (s === "CANCELLED") return "bg-rose-50 text-rose-800 border-rose-200";
  if (s === "PAYMENT_PROOF_SUBMITTED") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function statusLabel(s) {
  if (s === "PAYMENT_PROOF_SUBMITTED") return "⏳ PROOF SUBMITTED";
  return s;
}

export default function AdminOrdersPage() {
  const { showToast } = useCart();
  const [searchParams] = useSearchParams();

  const { data: orders = [], isLoading: isOrdersLoading } = useAdminOrdersQuery();
  const { data: stats } = useAdminDashboardStatsQuery();

  const updateStatusMutation = useUpdateOrderStatusMutation();
  const updateShippingMutation = useUpdateShippingDetailsMutation();
  const approvePaymentMutation = useApproveManualPaymentMutation();
  const rejectPaymentMutation = useRejectManualPaymentMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const urlStatus = searchParams.get("status") || searchParams.get("paymentStatus") || "all";
  const [statusFilter, setStatusFilter] = useState(urlStatus);

  useEffect(() => {
    const qStatus = searchParams.get("status") || searchParams.get("paymentStatus");
    if (qStatus) setStatusFilter(qStatus);
  }, [searchParams]);

  // Modals
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [shippingModalOrder, setShippingModalOrder] = useState(null);

  const isAuditingPayment = approvePaymentMutation.isPending || rejectPaymentMutation.isPending;

  // Status form
  const {
    register: registerStatus,
    handleSubmit: handleStatusSubmit,
    reset: resetStatus,
    watch: watchStatus,
    formState: { isSubmitting: isSubmittingStatus },
  } = useForm();
  const selectedStatus = watchStatus("status");
  const isUpdatingStatus = updateStatusMutation.isPending || isSubmittingStatus;

  // Shipping form
  const {
    register: registerShipping,
    handleSubmit: handleShippingSubmit,
    reset: resetShipping,
    formState: { isSubmitting: isSubmittingShipping },
  } = useForm();
  const isUpdatingShipping = updateShippingMutation.isPending || isSubmittingShipping;

  const handleOpenStatusModal = (order) => {
    setStatusModalOrder(order);
    resetStatus({
      status: order.status || "PROCESSING",
      cancellationReason: order.cancellationReason || "",
    });
  };

  const handleOpenShippingModal = (order) => {
    setShippingModalOrder(order);
    resetShipping({
      courierPartner: order.courierPartner || "",
      trackingNumber: order.trackingNumber || "",
      trackingUrl: order.trackingUrl || "",
      estimatedDeliveryDate: order.estimatedDeliveryDate
        ? String(order.estimatedDeliveryDate).slice(0, 10)
        : "",
    });
  };

  const onStatusSubmit = async (data) => {
    if (!statusModalOrder) return;
    try {
      await updateStatusMutation.mutateAsync({
        orderId: statusModalOrder.id,
        updateData: { status: data.status, cancellationReason: data.cancellationReason },
      });
      showToast(`Order status updated to ${data.status}`, "success");
      setStatusModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "warning");
    }
  };

  const onShippingSubmit = async (data) => {
    if (!shippingModalOrder) return;
    try {
      await updateShippingMutation.mutateAsync({
        orderId: shippingModalOrder.id,
        shippingData: {
          courierPartner: data.courierPartner,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          estimatedDeliveryDate: data.estimatedDeliveryDate,
        },
      });
      showToast("Tracking details saved!", "success");
      setShippingModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save shipping details", "warning");
    }
  };

  const handleApprovePayment = async (orderId) => {
    try {
      await approvePaymentMutation.mutateAsync(orderId);
      showToast("Payment approved! Order confirmed and customer notified.", "success");
      setReceiptModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payment", "warning");
    }
  };

  const handleRejectPayment = async (orderId) => {
    try {
      await rejectPaymentMutation.mutateAsync(orderId);
      showToast("Payment rejected. Stock returned to inventory.", "info");
      setReceiptModalOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject payment", "warning");
    }
  };

  const orderList = useMemo(() => {
    return Array.isArray(orders) ? orders : Array.isArray(orders?.content) ? orders.content : [];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orderList
      .filter((order) => {
        const matchesSearch =
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.utrNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        // Proof submitted = needs payment verification
        if (statusFilter === "PAYMENT_PROOF_SUBMITTED") {
          return matchesSearch && order.status === "PAYMENT_PROOF_SUBMITTED";
        }
        // Legacy filter kept for backwards compatibility
        if (statusFilter === "MANUAL_PENDING") {
          return (
            matchesSearch &&
            ((order.paymentMethod === "MANUAL" && order.paymentStatus === "PENDING") ||
              order.status === "PAYMENT_PROOF_SUBMITTED")
          );
        }
        if (statusFilter === "PAID") return matchesSearch && order.paymentStatus === "PAID";
        if (statusFilter === "COD") return matchesSearch && order.paymentMethod === "COD";
        if (statusFilter !== "all") {
          const s = order.status || order.orderStatus;
          return matchesSearch && (s === statusFilter || order.paymentStatus === statusFilter);
        }
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [orderList, searchTerm, statusFilter]);

  // Use server-side count when available; fall back to local count
  const pendingVerificationCount =
    stats?.pendingPaymentVerification ??
    orderList.filter((o) => o.status === "PAYMENT_PROOF_SUBMITTED").length;

  return (
    <AdminLayout
      title="Orders & Payment Audits"
      subtitle="Verify customer payments, audit UPI proof submissions, and manage courier dispatch"
      actions={
        <Link to="/admin/orders/new">
          <Button type="button" variant="primary" size="sm" icon={Plus}>
            Book WhatsApp / Offline Order
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-1">
              {stats?.totalOrders ?? orderList.length}
            </div>
            <span className="text-[11px] text-gray-400">All lifetime orders</span>
          </div>

          <div
            className="bg-amber-50/60 p-4 rounded-xs border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
            onClick={() => setStatusFilter("PAYMENT_PROOF_SUBMITTED")}
          >
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              ⏳ Proof Submitted
            </span>
            <div className="font-serif font-bold text-2xl text-amber-900 mt-1">
              {pendingVerificationCount}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Requires verification</span>
          </div>

          <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Processing & Shipped</span>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-1">
              {orderList.filter((o) => {
                const s = o.status || o.orderStatus;
                return s === "PROCESSING" || s === "SHIPPED";
              }).length}
            </div>
            <span className="text-[11px] text-blue-700">Active fulfillment</span>
          </div>

          <div className="bg-emerald-50/40 p-4 rounded-xs border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Delivered</span>
            <div className="font-serif font-bold text-2xl text-emerald-900 mt-1">
              {orderList.filter((o) => (o.status || o.orderStatus) === "DELIVERED").length}
            </div>
            <span className="text-[11px] text-emerald-700">Completed deliveries</span>
          </div>
        </div>

        {/* Alert banner when there are pending proofs */}
        {pendingVerificationCount > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xs p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Receipt size={20} className="text-amber-700 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {pendingVerificationCount} order{pendingVerificationCount > 1 ? "s" : ""} waiting for payment proof verification
                </p>
                <p className="text-xs text-amber-800">
                  Customers have uploaded UPI screenshots. Review and approve to confirm their orders.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter("PAYMENT_PROOF_SUBMITTED")}
              className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xs transition-colors cursor-pointer"
            >
              Review Proofs →
            </button>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID, Customer, Tracking No, UTR..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-gray-50 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              {[
                { value: "all", label: `All (${orderList.length})` },
                pendingVerificationCount > 0 && {
                  value: "PAYMENT_PROOF_SUBMITTED",
                  label: `⏳ Verify Proofs (${pendingVerificationCount})`,
                  active: "bg-amber-600 text-white",
                  inactive: "text-amber-800 bg-amber-100 hover:bg-amber-200",
                },
                { value: "CONFIRMED", label: "Confirmed" },
                { value: "PROCESSING", label: "Processing" },
                { value: "SHIPPED", label: "Shipped" },
                { value: "DELIVERED", label: "Delivered" },
                { value: "CANCELLED", label: "Cancelled", danger: true },
              ]
                .filter(Boolean)
                .map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                      statusFilter === tab.value
                        ? tab.active || (tab.danger ? "bg-rose-700 text-white" : "bg-[#800020] text-white")
                        : tab.inactive || (tab.danger ? "text-rose-700 hover:bg-rose-50" : "text-gray-600 hover:text-gray-900")
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
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
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Courier</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isOrdersLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const s = order.status || order.orderStatus || "PENDING";
                    const needsVerification =
                      s === "PAYMENT_PROOF_SUBMITTED" ||
                      (order.paymentMethod === "MANUAL" && order.paymentStatus === "PENDING");

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50/70 transition-colors ${
                          needsVerification ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* Order ID */}
                        <td className="py-3 px-4">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-mono font-bold text-gray-900 hover:text-[#800020] transition-colors"
                          >
                            {order.orderNumber || `#${order.id?.slice(0, 8).toUpperCase()}`}
                          </Link>
                          <div className="text-[11px] text-gray-500 mt-0.5">{formatDate(order.createdAt)}</div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-gray-900">
                            {order.shippingAddress?.fullName || "Patron Customer"}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </div>
                        </td>

                        {/* Payment */}
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
                          {order.utrNumber && (
                            <div className="mt-1 text-[11px] text-gray-600">
                              UTR:{" "}
                              <strong className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded-xs select-all">
                                {order.utrNumber}
                              </strong>
                            </div>
                          )}
                          {/* Audit trigger */}
                          {needsVerification && (
                            <button
                              type="button"
                              onClick={() => setReceiptModalOrder(order)}
                              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xs text-[10.5px] font-bold cursor-pointer transition-colors"
                            >
                              <Receipt size={11} />
                              <span>Audit Receipt</span>
                            </button>
                          )}
                        </td>

                        {/* Order Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border ${statusBadgeClass(s)}`}
                          >
                            {statusLabel(s)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(
                              order.finalAmount != null
                                ? order.finalAmount
                                : Number(order.totalAmount || 0) - Number(order.discountAmount || 0) + Number(order.shippingFee || 0)
                            )}
                          </div>
                          {Number(order.discountAmount) > 0 && (
                            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              Saved {formatCurrency(order.discountAmount)}
                            </div>
                          )}
                        </td>

                        {/* Courier */}
                        <td className="py-3 px-4">
                          {order.trackingNumber ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-gray-800 text-[11px] block">
                                {order.courierPartner || "Courier"}
                              </span>
                              <div className="font-mono text-[11px] text-[#800020] font-bold bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-xs inline-block select-all">
                                {order.trackingNumber}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">Not dispatched</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Status update */}
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(order)}
                              className="p-1.5 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xs cursor-pointer transition-colors"
                              title="Change Order Status"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            {/* Courier update */}
                            <button
                              type="button"
                              onClick={() => handleOpenShippingModal(order)}
                              className="p-1.5 text-gray-600 hover:text-[#800020] hover:bg-gray-100 rounded-xs cursor-pointer transition-colors"
                              title="Update Courier & Tracking"
                            >
                              <Truck size={15} />
                            </button>
                            {/* View details */}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== RECEIPT AUDIT MODAL ===== */}
        <Modal
          isOpen={!!receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
          title={`Audit Payment: ${receiptModalOrder?.orderNumber || `#${receiptModalOrder?.id?.slice(0, 8).toUpperCase()}`}`}
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
                  <strong>{receiptModalOrder?.shippingAddress?.fullName || "Customer"}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Amount:</span>
                  <strong>{formatCurrency(receiptModalOrder?.finalAmount ?? receiptModalOrder?.totalAmount)}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Order Status:</span>
                  <strong className="uppercase">{receiptModalOrder?.status}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Payment Status:</span>
                  <strong>{receiptModalOrder?.paymentStatus}</strong>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xs overflow-hidden bg-gray-100 min-h-[220px] flex flex-col items-center justify-center p-2">
              {receiptModalOrder?.paymentProofUrl ? (
                <a
                  href={receiptModalOrder.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block text-center"
                >
                  <img
                    src={receiptModalOrder.paymentProofUrl}
                    alt="UPI Payment Screenshot"
                    className="max-h-80 w-auto rounded-xs object-contain group-hover:opacity-90 transition-opacity"
                  />
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-amber-800 font-bold group-hover:underline">
                    <ExternalLink size={12} />
                    <span>Open Full Size Screenshot</span>
                  </div>
                </a>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <Receipt size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-xs">No screenshot attached.</p>
                  <p className="text-[11px] text-gray-400">
                    Customer submitted UTR only: {receiptModalOrder?.utrNumber || "N/A"}
                  </p>
                </div>
              )}
            </div>

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

        {/* ===== STATUS UPDATE MODAL ===== */}
        <Modal
          isOpen={!!statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          title={`Update Status: ${statusModalOrder?.orderNumber || `#${statusModalOrder?.id?.slice(0, 8).toUpperCase()}`}`}
          size="sm"
        >
          <form onSubmit={handleStatusSubmit(onStatusSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Order Status *
              </label>
              <select
                {...registerStatus("status")}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              >
                <option value="PENDING">PENDING</option>
                <option value="PAYMENT_PROOF_SUBMITTED">PAYMENT PROOF SUBMITTED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING (Packaging)</option>
                <option value="SHIPPED">SHIPPED (In Transit)</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {selectedStatus === "CANCELLED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs space-y-1">
                <label className="block text-xs uppercase font-bold tracking-wider text-rose-800">
                  Cancellation Reason *
                </label>
                <textarea
                  {...registerStatus("cancellationReason")}
                  rows={2}
                  placeholder="e.g. Payment proof unverified, customer request"
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xs outline-none focus:border-rose-700 bg-white font-medium text-rose-950"
                />
                <span className="text-[10.5px] text-rose-700 block">
                  ⚠️ Stock will be automatically returned to inventory.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button type="button" variant="outline" size="md" onClick={() => setStatusModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isUpdatingStatus} isLoading={isUpdatingStatus}>
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ===== SHIPPING DETAILS MODAL ===== */}
        <Modal
          isOpen={!!shippingModalOrder}
          onClose={() => setShippingModalOrder(null)}
          title={`Courier Details: ${shippingModalOrder?.orderNumber || `#${shippingModalOrder?.id?.slice(0, 8).toUpperCase()}`}`}
          size="md"
        >
          <form onSubmit={handleShippingSubmit(onShippingSubmit)} className="space-y-4 text-xs">
            <p className="text-[11px] text-gray-500 bg-blue-50 border border-blue-100 rounded-xs px-3 py-2">
              💡 This only saves courier/tracking details. It does <strong>not</strong> change the order status.
              If the order is already <strong>SHIPPED</strong>, the customer will receive an updated shipping email with the tracking number.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Courier Partner
                </label>
                <input
                  type="text"
                  {...registerShipping("courierPartner")}
                  placeholder="e.g. India Post, Blue Dart, DTDC"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Tracking / Consignment No.
                </label>
                <input
                  type="text"
                  {...registerShipping("trackingNumber")}
                  placeholder="e.g. EB891238910IN"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Tracking URL
                </label>
                <input
                  type="url"
                  {...registerShipping("trackingUrl")}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  {...registerShipping("estimatedDeliveryDate")}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button type="button" variant="outline" size="md" onClick={() => setShippingModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isUpdatingShipping} isLoading={isUpdatingShipping}>
                {isUpdatingShipping ? "Saving..." : "Save Tracking"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
