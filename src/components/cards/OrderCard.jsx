import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package, Calendar, CreditCard, Truck, Copy, Check } from "lucide-react";
import { formatCurrency, formatDate, getOrderStatusBadge, formatPaymentMethod } from "../../utils/formatters.js";
import Badge from "../common/Badge.jsx";

export default function OrderCard({ order }) {
  const [copied, setCopied] = useState(false);
  const badgeInfo = getOrderStatusBadge(order.status);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-line rounded-sm p-5 md:p-6 shadow-xs hover:border-rust/40 transition-all duration-300">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cream-2 flex items-center justify-center text-rust">
            <Package size={18} className="stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-charcoal">#{order.orderNumber}</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs border ${badgeInfo.bg}`}
              >
                {badgeInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-charcoal/50 mt-0.5">
              <Calendar size={12} />
              <span>Placed on {formatDate(order.orderDate)}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-charcoal/50 block">Total Amount</span>
          <span className="font-serif font-bold text-base text-charcoal">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Cancellation Notice if Cancelled */}
      {order.status === "CANCELLED" && (
        <div className="mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xs text-[11.5px] text-rose-900 flex flex-wrap items-center gap-1.5">
          <strong className="font-bold">Cancellation Reason:</strong>
          <span>{order.cancellationReason || "Cancelled by administrator / customer request"}</span>
        </div>
      )}

      {/* Postal & Courier Dispatch Tracking Info if Available */}
      {(order.courierName || order.trackingNumber) && order.status !== "CANCELLED" && (
        <div className="mt-3 px-3.5 py-2.5 bg-cream-2/60 border border-line rounded-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Truck size={15} className="text-rust shrink-0" />
            <span className="text-charcoal/80">
              Courier: <strong className="text-charcoal font-semibold">{order.courierName || "Courier Partner"}</strong>
              {order.trackingNumber && (
                <> • Tracking No: <strong className="font-mono text-charcoal bg-white px-1.5 py-0.5 rounded-xs border border-line">{order.trackingNumber}</strong></>
              )}
            </span>

          </div>

          {order.trackingNumber && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rust hover:text-rust-deep transition-colors cursor-pointer bg-white px-2 py-0.5 rounded-xs border border-line shadow-2xs"
              title="Copy tracking number"
            >
              {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              <span>{copied ? "Copied!" : "Copy No."}</span>
            </button>
          )}
        </div>
      )}


      {/* Item Previews */}
      <div className="py-4 space-y-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-14 object-cover rounded-xs border border-line bg-cream-2 shrink-0"
              />
              <div>
                <h4 className="font-semibold text-charcoal text-[13px] line-clamp-1">{item.name}</h4>
                <p className="text-[11px] text-charcoal/50 mt-0.5">
                  Qty: {item.qty} {item.size ? `• Size: ${item.size}` : ""}
                </p>
              </div>
            </div>
            <span className="font-semibold text-charcoal shrink-0">
              {formatCurrency(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 border-t border-line/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-charcoal/60">
          <CreditCard size={13} className="text-rust" />
          <span>{formatPaymentMethod(order.paymentMethod)}</span>
        </div>

        <Link
          to={`/account/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-rust font-bold uppercase tracking-wider text-[11px] hover:text-rust-deep transition-colors"
        >
          <span>View Order Details</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}

