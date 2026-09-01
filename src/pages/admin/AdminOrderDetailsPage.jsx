import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Truck,
  MapPin,
  CreditCard,
  CheckCircle,
  Package,
  Clock,
  Printer,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Receipt,
  ExternalLink,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { generateTaxInvoice } from "../../utils/invoiceGenerator.js";
import { orderStatusUpdateSchema } from "../../schemas/orderSchemas.js";
import {
  useAdminOrderDetailQuery,
  useUpdateOrderStatusMutation,
  useApproveManualPaymentMutation,
  useRejectManualPaymentMutation,
} from "../../queries/useOrderQueries.js";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import orderApi from "../../api/orderApi.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const { showToast } = useCart();

  const { data: order, isLoading } = useAdminOrderDetailQuery(id);
  const { data: storeSettings } = useBankDetailsQuery();

  const updateStatusMutation = useUpdateOrderStatusMutation();
  const approvePaymentMutation = useApproveManualPaymentMutation();
  const rejectPaymentMutation = useRejectManualPaymentMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderStatusUpdateSchema),
    values: {
      status: order?.status || order?.orderStatus || "PLACED",
      courierName: order?.courierPartner || order?.courierName || "Blue Dart Express",
      trackingNumber: order?.trackingNumber || "",
      trackingUrl: order?.trackingUrl || "",
      estimatedDeliveryDate: order?.estimatedDeliveryDate ? String(order.estimatedDeliveryDate).slice(0, 10) : "",
      cancellationReason: order?.cancellationReason || "",
    },
  });

  const selectedStatus = watch("status");
  const isUpdatingShipping = updateStatusMutation.isPending || isSubmitting;
  const isAuditingPayment = approvePaymentMutation.isPending || rejectPaymentMutation.isPending;

  const onUpdateShipping = async (data) => {
    try {
      const payload = {
        status: data.status,
        courierPartner: data.courierName,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        cancellationReason: data.cancellationReason,
      };
      await updateStatusMutation.mutateAsync({ orderId: id, updateData: payload });
      showToast("Order status & tracking updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update order", "warning");
    }
  };

  const handleApprovePayment = async () => {
    try {
      await approvePaymentMutation.mutateAsync(id);
      showToast("Manual payment verified! Order marked as PAID.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payment", "warning");
    }
  };

  const handleRejectPayment = async () => {
    try {
      await rejectPaymentMutation.mutateAsync(id);
      showToast("Manual payment rejected. Stock returned to inventory.", "info");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject payment", "warning");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Order Details" subtitle="Loading order details from database...">
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
        >
          Download Tax Invoice (PDF)
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
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-xs border ${
                order.orderStatus === "CANCELLED"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-[#800020]/10 text-[#800020] border-[#800020]/20"
              }`}
            >
              {order.orderStatus}
            </span>
            <span className="text-xs text-gray-600">
              Payment Status:{" "}
              <strong
                className={
                  order.paymentStatus === "PAID" ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"
                }
              >
                {order.paymentStatus} ({order.paymentMethod || "ONLINE"})
              </strong>
            </span>
            {order.orderStatus === "CANCELLED" && order.cancellationReason && (
              <span className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-xs font-medium">
                Reason: <strong>{order.cancellationReason}</strong>
              </span>
            )}
          </div>


          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Postal / Consignment No:</span>
            <strong className="text-xs font-mono bg-gray-50 px-2.5 py-1 rounded-xs border border-gray-200 select-all">
              {order.trackingNumber || "Pending Dispatch Generation"}
            </strong>
          </div>
        </div>


        {/* Manual Payment Verification Banner if applicable */}
        {order.paymentMethod === "MANUAL" && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xs p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-amber-800" />
                <h3 className="font-serif font-bold text-sm text-amber-900">
                  Manual UPI Payment Screenshot & Audit
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-xs">
                Status: {order.paymentStatus}
              </span>
            </div>

            {/* UTR Reference Highlight */}
            <div className="p-3 bg-white border border-amber-200 rounded-xs flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-950">Customer UTR / Transaction Reference ID:</span>
              <strong className="font-mono text-xs bg-amber-100 text-amber-950 px-2.5 py-1 rounded-xs border border-amber-300 select-all">
                {order.utrNumber || "No UTR Provided by Customer"}
              </strong>
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-center">
              {/* Receipt Preview */}
              <div className="border border-amber-200 rounded-xs overflow-hidden bg-white p-3 flex flex-col items-center justify-center min-h-[180px]">
                {order.paymentProofUrl ? (
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block text-center"
                    title="Click to view full size receipt screenshot in new tab"
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
                    <p className="text-[11px] text-amber-700">Customer provided UTR only: {order.utrNumber || "N/A"}</p>
                  </div>
                )}
              </div>

              {/* Action Decisions */}
              <div className="space-y-3">
                <p className="text-xs text-amber-800">
                  Review the customer's UPI payment screenshot and UTR <strong>{order.utrNumber || "N/A"}</strong> against your merchant bank account.
                  Approving will mark the order as <strong>PAID</strong> and ready for fulfillment.
                </p>
                {order.paymentStatus === "PENDING" && (
                  <div className="flex gap-2">
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
                )}
              </div>
            </div>
          </div>
        )}


        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Items Table (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
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

              {/* Total Calculation breakdown */}
              <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal (Product Price)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount ?? order.subtotal ?? 0)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Savings ({order.couponCode || "COUPON"})</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery & Courier Packaging</span>
                  <span className="font-medium text-gray-900">
                    {Number(order.shippingFee ?? order.deliveryFee ?? 0) === 0 ? "FREE" : formatCurrency(order.shippingFee ?? order.deliveryFee)}
                  </span>
                </div>
                {Number(order.codHandlingFee) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>COD Verification Fee</span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.codHandlingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2">
                  <span>Net Total Amount</span>
                  <span className="text-[#800020] text-base">
                    {formatCurrency(
                      order.finalAmount != null
                        ? order.finalAmount
                        : Number(order.totalAmount || 0) - Number(order.discountAmount || 0) + Number(order.shippingFee || 0) + Number(order.codHandlingFee || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping & Lifecycle Status Form */}
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Truck size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">
                  Dispatch & Courier Fulfillment
                </h3>
              </div>

              <form onSubmit={handleSubmit(onUpdateShipping)} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                      Order Lifecycle Status *
                    </label>
                    <select
                      {...register("status")}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  {selectedStatus === "CANCELLED" && (
                    <div className="sm:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-xs space-y-1">
                      <label className="block text-xs uppercase font-bold tracking-wider text-rose-800">
                        Cancellation Reason (Visible to Customer) *
                      </label>
                      <textarea
                        {...register("cancellationReason")}
                        rows={2}
                        placeholder="e.g. Payment unverified, item damaged/failed QC, or customer requested cancellation"
                        className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xs outline-none focus:border-rose-700 bg-white font-medium text-rose-950"
                      />
                      <span className="text-[10.5px] text-rose-700 block">
                        ⚠️ This reason is displayed in the patron's account and locked stock will be restored to catalog inventory.
                      </span>
                    </div>
                  )}


                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                      Courier / Postal Partner Name
                    </label>
                    <input
                      type="text"
                      {...register("courierName")}
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
                      {...register("trackingNumber")}
                      placeholder="e.g. EB891238910IN, BLUEDART-88910"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                      Tracking Link / Carrier URL
                    </label>
                    <input
                      type="url"
                      {...register("trackingUrl")}
                      placeholder="e.g. https://www.indiapost.gov.in/_layouts/15/dpt.cpt.tracking/trackconsignment.aspx"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="date"
                      {...register("estimatedDeliveryDate")}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                    />
                    <span className="text-[10.5px] text-gray-500 mt-1 block">
                      💡 The customer will see the Postal Tracking Number and carrier name with a copy button on their Order Details page.
                    </span>
                  </div>

                </div>


                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isUpdatingShipping}
                    isLoading={isUpdatingShipping}
                  >
                    {isUpdatingShipping ? "Saving Fulfillment..." : "Save Fulfillment Details"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Shipping Address & Customer Sidecard */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <MapPin size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">Shipping Address</h3>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-gray-900">
                  {order.shippingAddress?.fullName || "Patron Customer"}
                </div>
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
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <CreditCard size={16} className="text-[#800020]" />
                <h3 className="font-serif font-bold text-sm text-gray-900">Payment Summary</h3>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-semibold text-gray-900">{order.paymentMethod || "ONLINE"}</span>
                </div>
                {order.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gateway Ref:</span>
                    <span className="font-mono text-[11px] text-gray-700">{order.razorpayOrderId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-bold text-emerald-700">{order.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
