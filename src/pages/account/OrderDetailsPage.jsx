import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Truck,
  MapPin,
  CreditCard,
  CheckCircle,
  Package,
  XCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useUserOrderDetailQuery } from "../../queries/useOrderQueries.js";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import { formatCurrency, formatDate, getOrderStatusBadge, formatPaymentMethod } from "../../utils/formatters.js";
import { generateTaxInvoice } from "../../utils/invoiceGenerator.js";
import AccountLayout from "../../components/layout/AccountLayout.jsx";
import Button from "../../components/common/Button.jsx";
import useSEO from "../../hooks/useSEO.js";


function normalizeOrderDetail(o, id) {
  if (!o) {
    return {
      id: id || "ORD",
      orderNumber: id ? String(id).substring(0, 8).toUpperCase() : "SKM-ORD",
      status: "CONFIRMED",
      orderDate: new Date().toISOString(),
      totalAmount: 0,
      subtotal: 0,
      shippingFee: 0,
      discountAmount: 0,
      paymentMethod: "MANUAL",
      paymentStatus: "PENDING",
      trackingNumber: null,
      trackingUrl: null,
      courierName: "Courier Partner",
      cancellationReason: null,
      shippingAddress: {
        name: "Patron Delivery Address",
        addressLine1: "Standard Handloom Delivery",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "",
      },
      timeline: [
        { title: "Order Confirmed & Atelier Assigned", date: formatDate(new Date()), done: true },
        { title: "Handloom Quality & Zari Weave Check", date: "In Progress", done: false },
        { title: "Dispatched via Courier Partner", date: "Pending", done: false },
        { title: "Delivered to Patron", date: "Expected in 3-5 Days", done: false },
      ],
      items: [],
    };
  }

  const effectiveStatus = o.orderStatus || o.status || "CONFIRMED";
  const isCancelled = effectiveStatus === "CANCELLED";
  const isConfirmed = !isCancelled;
  const isProcessing = ["PROCESSING", "SHIPPED", "DELIVERED"].includes(effectiveStatus);
  const isShipped = ["SHIPPED", "DELIVERED"].includes(effectiveStatus);
  const isDelivered = effectiveStatus === "DELIVERED";

  const timeline = isCancelled
    ? [
        { title: "Order Placed", date: formatDate(o.createdAt || new Date()), done: true },
        {
          title: "Order Cancelled",
          date: o.cancellationReason ? `Reason: ${o.cancellationReason}` : "Cancelled by Store Administrator",
          done: true,
          isCancelled: true,
        },
      ]
    : [
        { title: "Order Confirmed & Atelier Assigned", date: formatDate(o.createdAt || new Date()), done: isConfirmed },
        { title: "Handloom Quality & Zari Weave Check", date: isProcessing ? "Completed" : "In Progress", done: isProcessing },
        { title: `Dispatched via ${o.courierName || "Courier Partner"}`, date: isShipped ? "In Transit" : "Pending", done: isShipped },
        { title: "Delivered to Patron", date: isDelivered ? "Delivered" : "Expected in 3-5 Days", done: isDelivered },
      ];

  return {
    id: o.id,
    orderNumber: o.orderNumber || (o.id ? String(o.id).substring(0, 8).toUpperCase() : "SKM-ORD"),
    status: effectiveStatus,
    orderDate: o.createdAt || o.orderDate || new Date().toISOString(),
    totalAmount: o.finalAmount != null ? Number(o.finalAmount) : Number(o.totalAmount || 0) - Number(o.discountAmount || 0) + Number(o.shippingFee || 0),
    finalAmount: o.finalAmount != null ? Number(o.finalAmount) : Number(o.totalAmount || 0) - Number(o.discountAmount || 0) + Number(o.shippingFee || 0),
    subtotal: Number(o.totalAmount ?? o.subtotal) || 0,
    shippingFee: Number(o.shippingFee) || 0,
    discountAmount: Number(o.discountAmount) || 0,
    couponCode: o.couponCode || null,
    codHandlingFee: Number(o.codHandlingFee) || 0,
    paymentMethod: o.paymentMethod || "MANUAL",
    paymentStatus: o.paymentStatus || "PENDING",
    trackingNumber: o.trackingNumber || o.awbNumber || null,
    trackingUrl: o.trackingUrl || null,
    courierName: o.courierName || null,
    estimatedDeliveryDate: o.estimatedDeliveryDate || null,
    cancellationReason: o.cancellationReason || null,
    shippingAddress: o.shippingAddress ? {
      name: o.shippingAddress.fullName || "Patron Customer",
      addressLine1: o.shippingAddress.addressLine1 || "",
      addressLine2: o.shippingAddress.addressLine2 || "",
      city: o.shippingAddress.city || "",
      state: o.shippingAddress.state || "",
      pincode: o.shippingAddress.postalCode || o.shippingAddress.pincode || "",
      phone: o.shippingAddress.phoneNumber || o.shippingAddress.phone || "",
    } : {
      name: "Patron Delivery Address",
      addressLine1: "Standard Handloom Delivery",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "+91 98207 85210",
    },
    timeline,
    items: (o.items || []).map((item) => ({
      name: item.productName || item.name || "Handcrafted Heritage Saree",
      qty: item.quantity || item.qty || 1,
      price: Number(item.price) || 0,
      size: item.size || "Standard",
      color: item.color || "Default",
      image:
        item.imageUrl ||
        item.image ||
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    })),
  };
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { data: dbOrder } = useUserOrderDetailQuery(id);
  const { data: storeSettings } = useBankDetailsQuery();
  const [copiedTracking, setCopiedTracking] = useState(false);

  const order = useMemo(() => normalizeOrderDetail(dbOrder, id), [dbOrder, id]);
  const badgeInfo = getOrderStatusBadge(order.status);

  useSEO({
    title: `Order #${order.orderNumber} Details — Shreekamalinee`,
    description: "Detailed tracking, shipment status, and item invoice.",
  });

  const handleCopyTracking = () => {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleDownloadInvoice = () => {
    generateTaxInvoice(order, storeSettings);
  };

  return (
    <AccountLayout
      title={`Order #${order.orderNumber}`}
      subtitle={`Placed on ${formatDate(order.orderDate)}`}
    >
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-charcoal/70 hover:text-rust transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-xs border ${badgeInfo.bg}`}
            >
              {badgeInfo.label}
            </span>

            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleDownloadInvoice}
            >
              Tax Invoice (PDF)
            </Button>
          </div>
        </div>

        {/* Cancellation Notice Banner */}
        {order.status === "CANCELLED" && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-sm text-rose-900 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle size={18} className="text-rose-700 shrink-0" />
              <h4 className="font-serif font-bold text-sm text-rose-950">This Order Has Been Cancelled</h4>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              {order.cancellationReason ? (
                <>
                  <strong>Reason for Cancellation: </strong>
                  <span>{order.cancellationReason}</span>
                </>
              ) : (
                <span>This order was cancelled by the store administrator. Any manual payment received will be adjusted or refunded.</span>
              )}
            </p>
          </div>
        )}

        {/* Postal & Courier Dispatch Tracking Card */}
        {order.status !== "CANCELLED" && (order.courierName || order.trackingNumber || order.estimatedDeliveryDate) && (
          <div className="bg-cream-2/50 border border-line rounded-sm p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Truck size={17} className="text-rust" />
                <h4 className="font-serif font-bold text-sm text-charcoal">
                  Postal / Courier Dispatch Tracking
                </h4>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rust/10 text-rust rounded-xs uppercase">
                {order.status === "DELIVERED" ? "Delivered" : order.status === "SHIPPED" ? "In Transit" : "Dispatched"}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-charcoal/60 block text-[11px] uppercase font-bold tracking-wider">
                  Courier / Postal Partner
                </span>
                <strong className="text-charcoal font-semibold text-sm">
                  {order.courierName || "Courier Partner"}
                </strong>
              </div>

              <div>
                <span className="text-charcoal/60 block text-[11px] uppercase font-bold tracking-wider">
                  Postal Consignment / Tracking No.
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <strong className="font-mono text-charcoal text-sm font-bold bg-white px-2.5 py-1 border border-line rounded-xs select-all shadow-2xs">
                    {order.trackingNumber || "Pending Generation"}
                  </strong>
                  {order.trackingNumber && (
                    <button
                      type="button"
                      onClick={handleCopyTracking}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-cream-2 border border-line rounded-xs text-[11px] font-bold text-charcoal/80 hover:text-rust transition-colors cursor-pointer"
                      title="Copy Consignment Tracking Number"
                    >
                      {copiedTracking ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedTracking ? "Copied!" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-charcoal/60 block text-[11px] uppercase font-bold tracking-wider">
                  Estimated Delivery Date
                </span>
                <strong className="text-emerald-800 text-sm font-semibold block mt-1">
                  {order.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : "3 - 5 Business Days"}
                </strong>
              </div>
            </div>

            <div className="pt-3 text-[11.5px] text-charcoal/65 leading-relaxed border-t border-line/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  Use this tracking number to track your parcel on the official{" "}
                  <strong className="text-charcoal font-semibold">{order.courierName || "carrier"}</strong> portal.
                </span>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rust hover:text-white border border-rust text-rust rounded-xs text-xs font-bold transition-all shadow-2xs"
                >
                  <ExternalLink size={13} />
                  <span>Track Consignment Online</span>
                </a>
              )}
            </div>
          </div>
        )}


        {/* Order Tracking Progress Stepper */}
        {order.timeline && (
          <div className="bg-white border border-line rounded-sm p-6 space-y-4 shadow-2xs">
            <h4 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
              <Package size={17} className="text-rust" />
              <span>Order Lifecycle & Progress</span>
            </h4>

            <div className="relative pl-6 space-y-6 border-l-2 border-rust/40 ml-3 py-2">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.isCancelled
                        ? "bg-rose-600 border-rose-600 text-white"
                        : step.done
                        ? "bg-rust border-rust text-white"
                        : "bg-white border-line text-transparent"
                    }`}
                  >
                    {step.done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>

                  <div className="space-y-0.5">
                    <h5
                      className={`text-xs uppercase font-bold tracking-wider ${
                        step.isCancelled
                          ? "text-rose-700"
                          : step.done
                          ? "text-charcoal"
                          : "text-charcoal/40"
                      }`}
                    >
                      {step.title}
                    </h5>
                    <span className={`text-[11px] ${step.isCancelled ? "text-rose-600 font-semibold" : "text-charcoal/50"}`}>
                      {step.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items List */}

        <div>
          <h4 className="font-serif font-bold text-base text-charcoal mb-4">
            Items in this Order ({order.items.length})
          </h4>

          <div className="border border-line rounded-sm divide-y divide-line overflow-hidden">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded-xs border border-line bg-cream-2 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rust tracking-wider">
                      {item.subcat}
                    </span>
                    <h5 className="font-serif font-bold text-sm text-charcoal">{item.name}</h5>
                    <p className="text-[11.5px] text-charcoal/60">
                      Qty: {item.qty} {item.size ? `• Size: ${item.size}` : ""}{" "}
                      {item.color ? `• Color: ${item.color}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-xs text-charcoal/50 block">Price</span>
                  <span className="font-serif font-bold text-sm sm:text-base text-charcoal">
                    {formatCurrency(item.price * item.qty)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address & Payment Breakdown Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="border border-line rounded-sm p-5 bg-white space-y-3">
            <h4 className="font-serif font-bold text-sm text-charcoal flex items-center gap-2 pb-2 border-b border-line">
              <MapPin size={15} className="text-rust" />
              <span>Delivery Address</span>
            </h4>
            <div className="text-xs text-charcoal/80 space-y-1 leading-relaxed">
              <strong className="block text-charcoal">{order.shippingAddress.name}</strong>
              <p>{order.shippingAddress.fullAddress}</p>
              <p>Phone: +91 {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="border border-line rounded-sm p-5 bg-white space-y-2 text-xs">
            <h4 className="font-serif font-bold text-sm text-charcoal flex items-center gap-2 pb-2 border-b border-line">
              <CreditCard size={15} className="text-rust" />
              <span>Payment Details</span>
            </h4>
            <div className="flex justify-between text-charcoal/70">
              <span>Payment Method</span>
              <span className="font-semibold text-charcoal">{formatPaymentMethod(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between text-charcoal/70">
              <span>Payment Status</span>
              <span className="font-semibold text-emerald-700">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between text-charcoal/70 pt-2 border-t border-line">
              <span>Items Subtotal</span>
              <span className="font-semibold text-charcoal">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Savings ({order.couponCode || "VOUCHER"})</span>
                <span>- {formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-charcoal/70">
              <span>Delivery & Handling</span>
              <span className="font-semibold text-charcoal">
                {order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee)}
              </span>
            </div>
            {order.codHandlingFee > 0 && (
              <div className="flex justify-between text-charcoal/70">
                <span>COD Verification Fee</span>
                <span className="font-semibold text-charcoal">{formatCurrency(order.codHandlingFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-line text-charcoal font-bold">
              <span className="font-serif text-sm">Net Total Amount</span>
              <span className="font-serif text-base text-rust">
                {formatCurrency(order.finalAmount || order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
