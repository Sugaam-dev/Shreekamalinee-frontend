import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function TermsPage() {
  useSEO({
    title: "Terms & Conditions — Shreekamalinee",
    description: "Terms and conditions for shopping at Shreekamalinee online store.",
  });

  return (
    <div className="bg-cream min-h-screen py-10 md:py-16">
      <div className="max-w-[900px] min-[2000px]:max-w-[1200px] mx-auto px-6 md:px-10">
        <Breadcrumb items={[{ label: "Terms & Conditions" }]} />

        <div className="bg-white border border-line rounded-sm p-8 md:p-12 shadow-xs space-y-6">
          <div className="border-b border-line pb-4">
            <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-rust block mb-1">
              Legal Agreement
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
              Terms & Conditions
            </h1>
            <span className="text-xs text-charcoal/45 mt-1 block">Last Updated: August 2026</span>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">1. Introduction</h3>
              <p>
                Welcome to Shreekamalinee. By accessing or using our website, online services, or purchasing handloom products, you agree to comply with and be bound by the following terms and conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">
                2. Handcrafted & Handloom Characteristics
              </h3>
              <p>
                Each piece in our collection is handwoven by traditional artisans. Minor variations in weave, texture, thread count, and natural dye colors are inherent hallmarks of authentic handloom craft rather than defects.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">
                3. Pricing & Payment Security
              </h3>
              <p>
                All prices listed on our website are in Indian Rupees (INR ₹) inclusive of all applicable statutory GST. Payments processed online through Razorpay are protected by industry-standard 256-bit SSL encryption.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">
                4. Intellectual Property
              </h3>
              <p>
                All text, graphics, logos, images, design motifs, and visual artwork displayed on this website are the proprietary property of Shreekamalinee and protected by copyright and intellectual property laws.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
