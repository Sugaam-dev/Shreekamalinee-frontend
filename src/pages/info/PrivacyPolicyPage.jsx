import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function PrivacyPolicyPage() {
  useSEO({
    title: "Privacy Policy — Shreekamalinee",
    description: "Learn how Shreekamalinee protects your personal data and privacy.",
  });

  return (
    <div className="bg-cream min-h-screen py-10 md:py-16">
      <div className="max-w-[900px] min-[2000px]:max-w-[1200px] mx-auto px-6 md:px-10">
        <Breadcrumb items={[{ label: "Privacy Policy" }]} />

        <div className="bg-white border border-line rounded-sm p-8 md:p-12 shadow-xs space-y-6">
          <div className="border-b border-line pb-4">
            <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-rust block mb-1">
              Data Protection
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">
              Privacy Policy
            </h1>
            <span className="text-xs text-charcoal/45 mt-1 block">Last Updated: August 2026</span>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">1. Information We Collect</h3>
              <p>
                We collect personal details that you provide when registering, creating orders, or reaching out to concierge support: name, email address, shipping address, contact phone number, and transaction references.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">
                2. How Your Information Is Used
              </h3>
              <p>
                Your data is strictly utilized to process and fulfill your orders, provide dispatch tracking notifications via SMS/WhatsApp, communicate order updates, and enhance your personalized shopping experience.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">
                3. Payment Information Security
              </h3>
              <p>
                We do not store your credit card, debit card, or net banking credentials on our servers. All financial transactions are securely processed through Razorpay's PCI-DSS Level 1 compliant gateway.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif font-bold text-base text-charcoal">
                4. Third-Party Disclosures
              </h3>
              <p>
                We never sell, rent, or trade your personal data to external marketing agencies. Information is shared only with logistics carriers (e.g. Blue Dart, Delhivery) strictly to ensure safe doorstep delivery.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
