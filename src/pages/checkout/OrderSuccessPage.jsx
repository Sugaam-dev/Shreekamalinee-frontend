import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, ArrowRight, Home, Download, ShieldCheck, Truck } from "lucide-react";
import { useUserOrderDetailQuery } from "../../queries/useOrderQueries.js";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import { generateTaxInvoice } from "../../utils/invoiceGenerator.js";
import { formatDate } from "../../utils/formatters.js";
import Button from "../../components/common/Button.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || null;

  const { data: dbOrder } = useUserOrderDetailQuery(orderId);
  const { data: storeSettings } = useBankDetailsQuery();

  const minDeliveryDays = storeSettings?.estimatedDeliveryDaysMin ?? 3;
  const maxDeliveryDays = storeSettings?.estimatedDeliveryDaysMax ?? 5;

  const estimatedDeliveryRange = useMemo(() => {
    if (dbOrder?.estimatedDeliveryDate) {
      return formatDate(dbOrder.estimatedDeliveryDate);
    }
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDeliveryDays);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDeliveryDays);

    const options = { day: "numeric", month: "short" };
    return `${minDate.toLocaleDateString("en-IN", options)} - ${maxDate.toLocaleDateString("en-IN", options)}`;
  }, [dbOrder, minDeliveryDays, maxDeliveryDays]);

  useSEO({
    title: "Order Confirmed — Shreekamalinee",
    description: "Thank you for supporting traditional Indian handloom weavers.",
  });

  const handleDownloadInvoice = () => {
    if (dbOrder) {
      generateTaxInvoice(dbOrder, storeSettings);
    } else if (orderId) {
      generateTaxInvoice({ id: orderId, orderNumber: orderId, totalAmount: 0 }, storeSettings);
    }
  };

  return (
    <div className="bg-cream min-h-screen py-12 md:py-20">
      <div className="max-w-[700px] mx-auto px-6 text-center">
        {/* Success Icon Animation */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-md animate-fadeIn">
          <CheckCircle size={42} className="stroke-[2.2]" />
        </div>

        <span className="text-xs uppercase font-bold tracking-[0.25em] text-rust block mb-2">
          Order Successfully Placed
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
          Dhanyawad for Your Order!
        </h1>
        <p className="text-sm text-charcoal/70 max-w-md mx-auto leading-relaxed mb-8">
          Your order has been recorded and queued for our master artisan dispatch unit. A verified confirmation receipt has been generated for you below.
        </p>

        {/* Order Details Card */}
        <div className="bg-white border border-line rounded-sm p-6 md:p-8 text-left shadow-xs mb-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-charcoal/45 tracking-wider block">
                Order Reference Number
              </span>
              <strong className="text-base md:text-lg font-serif text-charcoal">
                {dbOrder?.orderNumber || `#${String(orderId).slice(0, 8).toUpperCase()}`}
              </strong>
            </div>

            <div className="text-right">
              <span className="text-[10.5px] uppercase font-bold text-charcoal/45 tracking-wider block">
                Estimated Delivery SLA
              </span>
              <strong className="text-sm font-semibold text-emerald-700">
                {estimatedDeliveryRange}
              </strong>
            </div>
          </div>

          {/* Stepper Timeline Preview */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-charcoal mb-4">
              Current Shipment Status
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-rust text-white flex items-center justify-center mx-auto font-bold text-[10px]">
                  ✓
                </div>
                <span className="font-bold text-charcoal block">Confirmed</span>
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-cream-2 border border-line text-charcoal/60 flex items-center justify-center mx-auto font-bold text-[10px]">
                  2
                </div>
                <span className="text-charcoal/60 block">Weaving QC</span>
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-cream-2 border border-line text-charcoal/60 flex items-center justify-center mx-auto font-bold text-[10px]">
                  3
                </div>
                <span className="text-charcoal/60 block">Dispatched</span>
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-cream-2 border border-line text-charcoal/60 flex items-center justify-center mx-auto font-bold text-[10px]">
                  4
                </div>
                <span className="text-charcoal/60 block">Delivered</span>
              </div>
            </div>
          </div>

          {storeSettings?.deliveryPolicyNotice && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xs text-xs text-amber-950 text-left flex items-start gap-2.5 leading-relaxed">
              <span className="font-bold text-amber-900 text-xs">⚠️ Note:</span>
              <span>{storeSettings.deliveryPolicyNotice}</span>
            </div>
          )}

          <div className="pt-4 border-t border-line/60 flex items-center justify-between text-xs text-charcoal/65">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-rust" />
              <span>100% Authentic Handloom Guarantee</span>
            </div>
            <button
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-1.5 text-rust font-bold hover:underline cursor-pointer"
            >
              <Download size={13} />
              <span>Download Tax Invoice (PDF)</span>
            </button>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={`/account/orders`} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full" icon={Package}>
              View My Orders & Tracking
            </Button>
          </Link>

          <Link to="/shop" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full" icon={Home}>
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
