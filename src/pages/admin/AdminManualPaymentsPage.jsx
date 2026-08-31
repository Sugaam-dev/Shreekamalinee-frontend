import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Download,
  AlertTriangle,
  QrCode,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function AdminManualPaymentsPage() {
  const { showToast } = useCart();

  const [pendingPayments, setPendingPayments] = useState([
    {
      id: "TXN-901",
      orderId: "SKM-88910",
      customer: "Aaradhya Deshmukh",
      phone: "9820785210",
      amount: 4200,
      utrNumber: "HDFC9982310284",
      date: "2026-08-26, 11:20 AM",
      status: "PENDING_VERIFICATION",
      receiptUrl:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "TXN-902",
      orderId: "SKM-88741",
      customer: "Kavita Rao",
      phone: "9844123890",
      amount: 7899,
      utrNumber: "SBIN8821094812",
      date: "2026-08-26, 09:45 AM",
      status: "PENDING_VERIFICATION",
      receiptUrl:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    },
  ]);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const handleOpenReceipt = (txn) => {
    setSelectedTxn(txn);
    setReceiptModalOpen(true);
  };

  const handleApprove = (id, orderId) => {
    setPendingPayments((prev) => prev.filter((t) => t.id !== id));
    showToast(`Manual payment for Order #${orderId} approved and marked as PAID!`, "success");
    setReceiptModalOpen(false);
  };

  const handleReject = (id, orderId) => {
    if (window.confirm(`Reject manual payment for Order #${orderId}? Locked inventory will be returned.`)) {
      setPendingPayments((prev) => prev.filter((t) => t.id !== id));
      showToast(`Payment rejected for Order #${orderId}. Order cancelled.`, "warning");
      setReceiptModalOpen(false);
    }
  };

  return (
    <AdminLayout
      title="Manual UPI & Bank Transfer Approvals"
      subtitle="Verify submitted customer UTR numbers and payment receipts to approve order dispatch"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-white border border-line rounded-sm p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rust/10 text-rust flex items-center justify-center shrink-0">
            <QrCode size={20} />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-charcoal">
              Bank Transfer Verification Queue
            </h4>
            <p className="text-xs text-charcoal/60">
              When customers complete checkout using Direct UPI/QR, their UTR is submitted here. Approving will automatically transition the order to <strong>PROCESSING</strong>.
            </p>
          </div>
        </div>

        {/* Pending Queue Table */}
        <div className="bg-white border border-line rounded-sm shadow-xs overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h4 className="font-serif font-bold text-base text-charcoal">
              Pending Approvals ({pendingPayments.length})
            </h4>
          </div>

          {pendingPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-2/50 text-[10.5px] uppercase font-bold tracking-wider text-charcoal/60 border-b border-line">
                  <tr>
                    <th className="p-3.5">Order Reference</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">UTR / Txn ID</th>
                    <th className="p-3.5">Amount (₹)</th>
                    <th className="p-3.5">Submission Time</th>
                    <th className="p-3.5 text-center">Receipt Proof</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pendingPayments.map((t) => (
                    <tr key={t.id} className="hover:bg-cream-2/20 transition-colors">
                      <td className="p-3.5 font-bold text-charcoal">
                        <Link to={`/admin/orders/${t.orderId}`} className="text-rust hover:underline">
                          #{t.orderId}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <strong className="block text-charcoal">{t.customer}</strong>
                        <span className="text-[11px] text-charcoal/50">+91 {t.phone}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono bg-cream-2 px-2 py-0.5 rounded-xs border border-line font-bold text-charcoal">
                          {t.utrNumber}
                        </span>
                      </td>
                      <td className="p-3.5 font-serif font-bold text-charcoal">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="p-3.5 text-charcoal/50">{t.date}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenReceipt(t)}
                          className="inline-flex items-center gap-1 text-[11px] text-rust font-bold hover:underline cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View Proof</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(t.id, t.orderId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(t.id, t.orderId)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xs font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <XCircle size={12} />
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
            <div className="p-12 text-center text-charcoal/50">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-serif font-bold text-base text-charcoal">All Clear!</p>
              <p className="text-xs">No pending manual payment verification requests.</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Proof Viewer Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title={`Payment Receipt Proof — Order #${selectedTxn?.orderId}`}
        subtitle={`UTR Number: ${selectedTxn?.utrNumber}`}
      >
        <div className="space-y-4">
          <div className="border border-line rounded-xs overflow-hidden bg-cream-2 max-h-[450px] flex items-center justify-center">
            <img
              src={selectedTxn?.receiptUrl}
              alt="Payment Slip Proof"
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs">
              <span className="text-charcoal/50 block">Amount to verify:</span>
              <strong className="font-serif font-bold text-base text-rust">
                {selectedTxn && formatCurrency(selectedTxn.amount)}
              </strong>
            </div>

            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => selectedTxn && handleReject(selectedTxn.id, selectedTxn.orderId)}
              >
                Reject Proof
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => selectedTxn && handleApprove(selectedTxn.id, selectedTxn.orderId)}
              >
                Approve Payment
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
