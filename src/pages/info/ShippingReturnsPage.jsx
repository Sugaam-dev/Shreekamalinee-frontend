import { Truck, RefreshCw, ShieldCheck, Clock } from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import useSEO from "../../hooks/useSEO.js";

export default function ShippingReturnsPage() {
  const { data: settings } = useBankDetailsQuery();

  const freeShippingThreshold = settings?.freeShippingThreshold != null ? settings.freeShippingThreshold : 1499;
  const deliveryFee = settings?.deliveryFee != null ? settings.deliveryFee : 99;
  const estimatedDays = settings?.estimatedDeliveryDays || "3-5 Business Days";

  useSEO({
    title: "Shipping & Returns Policy — Shreekamalinee",
    description: "Detailed timelines for domestic shipping, international delivery, and 7-day hassle-free returns.",
  });

  return (
    <div className="bg-cream min-h-screen py-10 md:py-16">
      <div className="max-w-[1000px] min-[2000px]:max-w-[1300px] mx-auto px-6 md:px-10">
        <Breadcrumb items={[{ label: "Shipping & Returns" }]} />

        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-rust block mb-2">
            Store Policies
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-charcoal">
            Shipping & Returns
          </h1>
          <div className="w-16 h-0.5 bg-rust mx-auto mt-4" />
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-line p-6 rounded-sm text-center shadow-xs">
            <Truck size={28} className="text-rust mx-auto mb-3" />
            <h4 className="font-serif font-bold text-sm text-charcoal mb-1">Free Shipping</h4>
            <p className="text-xs text-charcoal/60">On domestic orders over ₹{freeShippingThreshold.toLocaleString("en-IN")}</p>
          </div>

          <div className="bg-white border border-line p-6 rounded-sm text-center shadow-xs">
            <Clock size={28} className="text-rust mx-auto mb-3" />
            <h4 className="font-serif font-bold text-sm text-charcoal mb-1">{estimatedDays} Delivery</h4>
            <p className="text-xs text-charcoal/60">Dispatched via Blue Dart & Delhivery</p>
          </div>

          <div className="bg-white border border-line p-6 rounded-sm text-center shadow-xs">
            <RefreshCw size={28} className="text-rust mx-auto mb-3" />
            <h4 className="font-serif font-bold text-sm text-charcoal mb-1">7-Day Exchanges</h4>
            <p className="text-xs text-charcoal/60">Hassle-free replacement policy</p>
          </div>

          <div className="bg-white border border-line p-6 rounded-sm text-center shadow-xs">
            <ShieldCheck size={28} className="text-rust mx-auto mb-3" />
            <h4 className="font-serif font-bold text-sm text-charcoal mb-1">Transit Insured</h4>
            <p className="text-xs text-charcoal/60">100% safe luxury packaging</p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="bg-white border border-line rounded-sm p-8 md:p-12 shadow-xs space-y-8 text-xs sm:text-sm text-charcoal/80 leading-relaxed">
          <section className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-charcoal border-b border-line pb-2">
              Domestic Shipping Guidelines
            </h3>
            <p>
              We provide express, insured shipping across all serviceable pin codes in India. Orders placed before 2:00 PM IST are processed and dispatched on the same business day from our Varanasi fulfillment center.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-charcoal/70">
              <li>
                <strong>Free Delivery:</strong> Applied automatically on all domestic cart orders of <strong>₹{freeShippingThreshold.toLocaleString("en-IN")} or more</strong>.
              </li>
              <li>
                <strong>Standard Shipping:</strong> A flat fee of <strong>₹{deliveryFee}</strong> applies to orders below ₹{freeShippingThreshold.toLocaleString("en-IN")}.
              </li>
              <li>
                <strong>Delivery Timeline:</strong> Typically delivered within <strong>{estimatedDays}</strong> depending on your region.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-charcoal border-b border-line pb-2">
              Returns & Exchange Policy
            </h3>
            <p>
              Every Shreekamalinee creation undergoes rigorous artisan inspection. If you receive an item with manufacturing imperfections or wish to exchange sizing, you can request an exchange within <strong>7 days</strong> of delivery.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}