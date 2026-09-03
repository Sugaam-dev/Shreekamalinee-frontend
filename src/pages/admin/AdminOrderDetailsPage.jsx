import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Truck,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  Receipt,
  ExternalLink,
  Download,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { generateTaxInvoice } from "../../utils/invoiceGenerator.js";
import {
  useAdminOrderDetailQuery,
  useUpdateOrderStatusMutation,
  useUpdateShippingDetailsMutation,
  useApproveManualPaymentMutation,
  useRejectManualPaymentMutation,
} from "../../queries/useOrderQueries.js";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";

// Badge colors for every possible order status
function StatusBadge({ status }) {
  const map = {
    DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    SHIPPED: "bg-blue-50 text-blue-800 border-blue-200",
    PROCESSING: "bg-purple-50 text-purple-800 border-purple-200",
    CONFIRMED: "bg-indigo-50 text-indigo-800 border-indigo-200",
    CANCELLED: "bg-rose-50 text-rose-800 border-rose-200",
    PAYMENT_PROOF_SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const cls = map[status] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-xs border ${cls}`}>
      {status === "PAYMENT_PROOF_SUBMITTED" ? "⏳ Proof Submitted" : status}
    </span>
  );
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const { showToast } = useCart();

  const { data: order, isLoading } = useAdminOrderDetailQuery(id);
  const { data: storeSettings } = useBankDetailsQuery();

  const updateStatusMutation = useUpdateOrderStatusMutation();
  const updateShippingMutation = useUpdateShippingDetailsMutation();
  const approvePaymentMutation = useApproveManualPaymentMutation();
  const rejectPaymentMutation = useRejectManualPaymentMutation();

  // --- Form 1: Status only ---
  const {
    register: registerStatus,
    handleSubmit: handleStatusSubmit,
    watch: watchStatus,
    formState: { isSubmitting: isSubmittingStatus },
  } = useForm({
    values: {
      status: order?.status || "PENDING",
      cancellationReason: order?.cancellationReason || "",
    },
  });

  // --- Form 2: Shipping/Courier details only ---
  const {
    register: registerShipping,
    handleSubmit: handleShippingSubmit,
    formState: { isSubmitting: isSubmittingShipping },
  } = useForm({
    values: {
      courierPartner: order?.courierPartner || "",
      trackingNumber: order?.trackingNumber || "",
      trackingUrl: order?.trackingUrl || "",
      estimatedDeliveryDate: order?.estimatedDeliveryDate
        ? String(order.estimatedDeliveryDate).slice(0, 10)
        : "",
    },
  });

  const selectedStatus = watchStatus("status");
  const isAuditingPayment = approvePaymentMutation.isPending || rejectPaymentMutation.isPending;
  const isUpdatingStatus = updateStatusMutation.isPending || isSubmittingStatus;
  const isUpdatingShipping = updateShippingMutation.isPending || isSubmittingShipping;

  const onStatusUpdate = async (data) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId: id,
        updateData: { status: data.status, cancellationReason: data.cancellationReason },
      });
      showToast(`Order status updated to ${data.status}`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "warning");
    }
  };

  const onShippingUpdate = async (data) => {
    try {
      await updateShippingMutation.mutateAsync({
        orderId: id,
        shippingData: {
          courierPartner: data.courierPartner,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          estimatedDeliveryDate: data.estimatedDeliveryDate,
        },
      });
      showToast("Shipping & tracking details saved!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save shipping details", "warning");
    }
  };

  const handleApprovePayment = async () => {
    try {
      await approvePaymentMutation.mutateAsync(id);
      showToast("Payment approved! Order confirmed and customer notified.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payment", "warning");
    }
  };

  const handleRejectPayment = async () => {
    try {
      await rejectPaymentMutation.mutateAsync(id);
      showToast("Payment rejected. Order cancelled and stock restored.", "info");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject payment", "warning");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Order Details" subtitle="Loading order details...">
        <div className="py-20 text-center text-xs text-gray-400">Loading order records...</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Order Details" subtitle="Order not found">
        <div className="py-20 text-center text-xs text-gray-500">
          Order not found.{" "}
          <Link to="/admin/orders" className="text-[#800020] underline">
            Return to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Payment verification/approval is needed for:
  // 1. PAYMENT_PROOF_SUBMITTED (UPI proof submitted)
  // 2. MANUAL payment method with PENDING/UNPAID payment status (admin-created order)
  // 3. COD payment method when paymentStatus is not yet PAID (collected on delivery)
  const needsPaymentVerification =
    order.status === "PAYMENT_PROOF_SUBMITTED" ||
    (order.paymentMethod === "MANUAL" && order.paymentStatus !== "PAID") ||
    (order.paymentMethod === "COD" && order.paymentStatus !== "PAID");

  return (
    <AdminLayout
      title={`Order ${order.orderNumber || `#${order.id?.slice(0, 8).toUpperCase()}`}`}
      subtitle={`Placed on ${formatDate(order.createdAt)}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          icon={Download}
          onClick={() => generateTaxInvoice(order, storeSettings)}
          title="Download Tax Invoice PDF"
          className="px-2.5 sm:px-3 text-xs"
        >
          <span className="hidden sm:inline">Download Tax Invoice (PDF)</span>
          <span className="sm:hidden">Invoice PDF</span>
        </Button>
      }
    >
      <div className="space-y-6 max-w-5xl">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#800020] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to All Orders</span>
        </Link>

        {/* Order Status Ribbon */}
        <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={order.status} />
            <span className="text-xs text-gray-600">
              Payment:{" "}
              <strong
                className={
                  order.paymentStatus === "PAID" ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"
                }
              >
                {order.paymentStatus} ({order.paymentMethod || "ONLINE"})
              </strong>
            </span>
            {order.status === "CANCELLED" && order.cancellationReason && (
              <span className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-xs font-medium">
                Reason: <strong>{order.cancellationReason}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Consignment No:</span>
            <strong className="text-xs font-mono bg-gray-50 px-2.5 py-1 rounded-xs border border-gray-200 select-all">
              {order.trackingNumber || "Pending Dispatch"}
            </strong>
          </div>
        </div>

        {/* ===== PAYMENT VERIFICATION BANNER ===== */}
        {needsPaymentVerification && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xs p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-800" />
                <h3 className="font-serif font-bold text-sm text-amber-900">
                  {order.paymentMethod === "COD"
                    ? "💵 Cash on Delivery (COD) — Mark Payment Collected"
                    : order.paymentMethod === "MANUAL"
                    ? "📝 Manual Order — Confirm Payment Received"
                    : "⚠️ Direct UPI Payment — Awaiting Admin Verification"}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-xs">
                {order.status === "PAYMENT_PROOF_SUBMITTED" ? "PROOF SUBMITTED" : order.paymentStatus}
              </span>
            </div>

            {/* UTR */}
            <div className="p-3 bg-white border border-amber-200 rounded-xs flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-950">Customer UTR / Transaction Reference ID:</span>
              <strong className="font-mono text-xs bg-amber-100 text-amber-950 px-2.5 py-1 rounded-xs border border-amber-300 select-all">
                {order.utrNumber || "No UTR Provided by Customer"}
              </strong>
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-start">
              {/* Screenshot Preview */}
              <div className="border border-amber-200 rounded-xs overflow-hidden bg-white p-3 flex flex-col items-center justify-center min-h-[180px]">
                {order.paymentProofUrl ? (
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block text-center"
                  >
                    <img
                      src={order.paymentProofUrl}
                      alt="Customer Payment Receipt"
                      className="max-h-60 w-auto rounded-xs object-contain group-hover:opacity-90 transition-opacity"
                    />
                    <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-amber-900 font-bold group-hover:underline">
                      <ExternalLink size={12} />
                      <span>Open Full Size Proof</span>
                    </div>
                  </a>
                ) : (
                  <div className="text-center py-6 text-amber-800">
                    <Receipt size={28} className="mx-auto text-amber-600 mb-1.5" />
                    <p className="font-semibold text-xs">No screenshot image attached</p>
                    <p className="text-[11px] text-amber-700">UTR: {order.utrNumber || "N/A"}</p>
                  </div>
                )}
              </div>

              {/* Approve / Reject */}
              <div className="space-y-3">
                <p className="text-xs text-amber-800">
                  Review the customer&apos;s UPI screenshot and UTR{" "}
                  <strong>{order.utrNumber || "N/A"}</strong> against your merchant bank account.
                  Approving will mark the order as <strong>PAID + CONFIRMED</strong> and notify the
                  customer by email.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    icon={CheckCircle2}
                    disabled={isAuditingPayment}
                    isLoading={approvePaymentMutation.isPending}
                    onClick={handleApprovePayment}
                  >
                    {approvePaymentMutation.isPending ? "Approving..." : "Approve Payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    icon={XCircle}
                    disabled={isAuditingPayment}
                    isLoading={rejectPaymentMutation.isPending}
                    onClick={handleRejectPayment}
                  >
                    {rejectPaymentMutation.isPending ? "Rejecting..." : "Reject Proof"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
                Order Items ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-serif font-bold text-gray-900">{item.productName}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>Size: {item.size || "Free Size"}</span>
                        <span>•</span>
                        <span>Color: {item.color || "Standard"}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>{formatCurrency(item.price)} each</span>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount ?? 0)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon ({order.couponCode})</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-medium text-gray-900">
                    {Number(order.shippingFee ?? 0) === 0 ? "FREE" : formatCurrency(order.shippingFee)}
                  </span>
                </div>
                {Number(order.codHandlingFee) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>COD Fee</span>
                    <span>{formatCurrency(order.codHandlingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2">
                  <span>Net Total</span>
                  <span className="text-[#800020] text-base">
                    {formatCurrency(order.finalAmount ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== FORM 1: ORDER STATUS ONLY ===== */}
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <CheckCircle2 size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">
                  Order Lifecycle Status
                </h3>
                <span className="text-[10px] text-gray-400 ml-auto">
                  Changes status only — triggers customer email
                </span>
              </div>
              <form onSubmit={handleStatusSubmit(onStatusUpdate)} className="space-y-4 text-xs">
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
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                {selectedStatus === "CANCELLED" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs space-y-1">
                    <label className="block text-xs uppercase font-bold tracking-wider text-rose-800">
                      Cancellation Reason (visible to customer) *
                    </label>
                    <textarea
                      {...registerStatus("cancellationReason")}
                      rows={2}
                      placeholder="e.g. Payment unverified, item damaged, customer request"
                      className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xs outline-none focus:border-rose-700 bg-white font-medium text-rose-950"
                    />
                    <span className="text-[10.5px] text-rose-700 block">
                      ⚠️ This reason is displayed in the patron's account and locked stock will be restored.
                    </span>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="md" disabled={isUpdatingStatus} isLoading={isUpdatingStatus}>
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </form>
            </div>

            {/* ===== FORM 2: SHIPPING / COURIER DETAILS ONLY ===== */}
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Truck size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">
                  Courier & Tracking Details
                </h3>
                <span className="text-[10px] text-gray-400 ml-auto">
                  Does not change status — customer gets tracking email if already SHIPPED
                </span>
              </div>
              <form onSubmit={handleShippingSubmit(onShippingUpdate)} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                      Courier / Postal Partner
                    </label>
                    <input
                      type="text"
                      {...registerShipping("courierPartner")}
                      placeholder="e.g. India Post Speed Post, Blue Dart, DTDC"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                      Consignment / Tracking No.
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
                      placeholder="https://www.indiapost.gov.in/..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
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
                    <span className="text-[10.5px] text-gray-500 mt-1 block">
                      💡 If order is already SHIPPED, saving tracking will re-send the shipping email to customer.
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="md" disabled={isUpdatingShipping} isLoading={isUpdatingShipping}>
                    {isUpdatingShipping ? "Saving..." : "Save Tracking Details"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <MapPin size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">Shipping Address</h3>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-900">{order.shippingAddress?.fullName || "Patron Customer"}</div>
                <div className="text-gray-600">{order.shippingAddress?.addressLine1}</div>
                {order.shippingAddress?.addressLine2 && (
                  <div className="text-gray-600">{order.shippingAddress?.addressLine2}</div>
                )}
                <div className="text-gray-600">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </div>
                <div className="font-mono text-gray-800 font-semibold">
                  Postal Code: {order.shippingAddress?.postalCode}
                </div>
                <div className="text-gray-600">{order.shippingAddress?.country || "India"}</div>
                {order.shippingAddress?.phoneNumber && (
                  <div className="text-gray-700 font-medium mt-1">📞 {order.shippingAddress?.phoneNumber}</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <CreditCard size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">Payment Summary</h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-semibold text-gray-900">{order.paymentMethod || "ONLINE"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`font-bold ${
                      order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                {order.utrNumber && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">UTR:</span>
                    <span className="font-mono text-[11px] text-gray-700 bg-gray-50 px-1.5 rounded-xs select-all break-all">
                      {order.utrNumber}
                    </span>
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gateway Ref:</span>
                    <span className="font-mono text-[11px] text-gray-700">{order.razorpayOrderId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
