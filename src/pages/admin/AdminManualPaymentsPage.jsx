import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Receipt,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { TableRowSkeleton } from "../../components/common/Skeleton.jsx";
import {
  useAdminOrdersQuery,
  useApproveManualPaymentMutation,
  useRejectManualPaymentMutation,
} from "../../queries/useOrderQueries.js";

export default function AdminManualPaymentsPage() {
  const { showToast } = useCart();

  const { data: orders = [], isLoading } = useAdminOrdersQuery();
  const approvePaymentMutation = useApproveManualPaymentMutation();
  const rejectPaymentMutation = useRejectManualPaymentMutation();

  const [selectedOrder, setSelectedOrder] = useState(null);

  const isAuditingPayment = approvePaymentMutation.isPending || rejectPaymentMutation.isPending;

  // Orders pending payment verification — matches new PAYMENT_PROOF_SUBMITTED status
  // or fallback to old MANUAL + PENDING check for any legacy orders
  const pendingOrders = Array.isArray(orders)
    ? orders.filter(
        (o) =>
          o.status === "PAYMENT_PROOF_SUBMITTED" ||
          (o.paymentMethod === "MANUAL" && o.paymentStatus === "PENDING")
      )
    : [];

  const handleApprove = async (orderId) => {
    try {
      await approvePaymentMutation.mutateAsync(orderId);
      showToast("Payment approved! Order confirmed and customer notified.", "success");
      setSelectedOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payment", "warning");
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm("Reject this payment proof? The order will be CANCELLED and stock restored.")) return;
    try {
      await rejectPaymentMutation.mutateAsync(orderId);
      showToast("Payment rejected. Order cancelled and stock restored.", "info");
      setSelectedOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject payment", "warning");
    }
  };

  return (
    <AdminLayout
      title="Manual UPI Payment Verification"
      subtitle="Review customer-submitted payment proof screenshots and UTR numbers before confirming orders"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-white border border-amber-200 rounded-xs p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-gray-900">
              Payment Proof Verification Queue
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              When customers checkout via Direct UPI/Bank Transfer, their UTR reference and screenshot land here with status{" "}
              <strong className="text-amber-700">PAYMENT_PROOF_SUBMITTED</strong>.
              Approving will set the order to <strong>CONFIRMED + PAID</strong> and notify the customer by email.
              Rejecting will CANCEL the order and return stock to inventory.
            </p>
          </div>
        </div>

        {/* Pending Verification Table */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-serif font-bold text-base text-gray-900">
              Pending Verification ({isLoading ? "..." : pendingOrders.length})
            </h4>
            {pendingOrders.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-xs">
                ⚠️ Action Required
              </span>
            )}
          </div>

          {isLoading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))}
              </tbody>
            </table>
          ) : pendingOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10.5px] uppercase font-bold tracking-wider text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">UTR / Transaction ID</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Submitted</th>
                    <th className="p-3.5 text-center">Proof</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-3.5 font-bold">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-[#800020] hover:underline font-mono"
                        >
                          {order.orderNumber || `#${order.id?.slice(0, 8).toUpperCase()}`}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <strong className="block text-gray-900">
                          {order.shippingAddress?.fullName || "Customer"}
                        </strong>
                        <span className="text-[11px] text-gray-500">
                          {order.shippingAddress?.phoneNumber || ""}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs font-bold text-amber-900 select-all">
                          {order.utrNumber || "No UTR"}
                        </span>
                      </td>
                      <td className="p-3.5 font-serif font-bold text-gray-900">
                        {formatCurrency(order.finalAmount ?? order.totalAmount ?? 0)}
                      </td>
                      <td className="p-3.5 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="p-3.5 text-center">
                        {order.paymentProofUrl ? (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#800020] font-bold hover:underline cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">UTR only</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xs font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={11} />
                            <span>Review</span>
                          </button>
                          <button
                            onClick={() => handleApprove(order.id)}
                            disabled={isAuditingPayment}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xs font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 size={11} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={isAuditingPayment}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xs font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <XCircle size={11} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
              <p className="font-serif font-bold text-base text-gray-900">All Clear!</p>
              <p className="text-xs text-gray-500 mt-1">
                No pending manual payment verification requests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Viewer & Decision Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Payment Proof — ${selectedOrder?.orderNumber || `#${selectedOrder?.id?.slice(0, 8).toUpperCase()}`}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            {/* Order summary */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                <span className="font-bold text-amber-950">UTR / Transaction Reference:</span>
                <span className="font-mono bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-xs select-all">
                  {selectedOrder.utrNumber || "No UTR Provided"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div>
                  <span className="text-amber-700/80 block">Customer:</span>
                  <strong className="text-amber-950">{selectedOrder.shippingAddress?.fullName || "Customer"}</strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Amount to verify:</span>
                  <strong className="text-amber-950 text-xs">
                    {formatCurrency(selectedOrder.finalAmount ?? selectedOrder.totalAmount)}
                  </strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Phone:</span>
                  <strong className="text-amber-950 font-mono">
                    {selectedOrder.shippingAddress?.phoneNumber || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-amber-700/80 block">Order Status:</span>
                  <strong className="text-amber-950 uppercase">{selectedOrder.status}</strong>
                </div>
              </div>
            </div>

            {/* Proof image */}
            <div className="border border-gray-200 rounded-xs overflow-hidden bg-gray-100 min-h-[220px] flex flex-col items-center justify-center p-2">
              {selectedOrder.paymentProofUrl ? (
                <a
                  href={selectedOrder.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block text-center"
                >
                  <img
                    src={selectedOrder.paymentProofUrl}
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
                    Customer submitted UTR only: {selectedOrder.utrNumber || "N/A"}
                  </p>
                </div>
              )}
            </div>

            {/* Decision buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <Button
                type="button"
                variant="danger"
                size="md"
                icon={XCircle}
                disabled={isAuditingPayment}
                isLoading={rejectPaymentMutation.isPending}
                onClick={() => handleReject(selectedOrder.id)}
              >
                Reject & Cancel Order
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={CheckCircle2}
                disabled={isAuditingPayment}
                isLoading={approvePaymentMutation.isPending}
                onClick={() => handleApprove(selectedOrder.id)}
              >
                Approve & Confirm Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
