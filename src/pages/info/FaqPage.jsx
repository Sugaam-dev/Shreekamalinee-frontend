import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function FaqPage() {
  useSEO({
    title: "Frequently Asked Questions (FAQ) — Shreekamalinee",
    description: "Get answers to your questions about ordering, shipping, handloom authenticity, and saree care.",
  });

  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      category: "Ordering & Handloom Details",
      items: [
        {
          q: "How do I know if a saree or dress material is in stock?",
          a: "All products listed with an 'Add to Bag' button are ready for immediate dispatch from our studio inventory. If a piece is marked 'Sold Out', you can reach out via WhatsApp to inquire about loom restocking timelines.",
        },
        {
          q: "Do the sarees include a matching blouse piece?",
          a: "Yes! Most of our authentic handloom sarees include an unstitched matching or contrasting blouse piece fabric attached directly to the weave, as detailed on each product page.",
        },
      ],
    },
    {
      category: "Shipping & Delivery",
      items: [
        {
          q: "What are the shipping charges and delivery timelines?",
          a: "We offer Free Express Insured Shipping across India on all orders exceeding ₹1,499. Orders are packed within 24-48 business hours and delivered in 3 to 5 business days via Blue Dart and Delhivery.",
        },
        {
          q: "Do you ship internationally?",
          a: "Yes, we ship our authentic handloom creations worldwide via DHL Express. For international orders, kindly reach out directly on WhatsApp (+91 98207 85210) for custom shipping rates and currency conversion.",
        },
      ],
    },
    {
      category: "Authenticity & Handloom Care",
      items: [
        {
          q: "Are the sarees 100% genuine handloom?",
          a: "Every single saree in our collection is handwoven by master weavers in traditional handloom clusters of Maharashtra, Gujarat, and Andhra Pradesh. We provide an authentic Handloom Assurance Guarantee with each purchase.",
        },
        {
          q: "How should I wash and store my pure silk and Paithani sarees?",
          a: "We strictly recommend dry cleaning for the initial 3 washes. Store in pure cotton or muslin bags in a cool, dry place. Avoid using plastic covers or direct perfume sprays on zari borders.",
        },
      ],
    },
  ];

  return (
    <div className="bg-cream min-h-screen py-10 md:py-16">
      <div className="max-w-[1000px] min-[2000px]:max-w-[1400px] mx-auto px-6 md:px-10">
        <Breadcrumb items={[{ label: "Frequently Asked Questions" }]} />

        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-rust block mb-2">
            Help & Knowledge Base
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-charcoal">
            Frequently Asked Questions
          </h1>
          <div className="w-16 h-0.5 bg-rust mx-auto mt-4" />
        </div>

        {/* FAQ Groups */}
        <div className="space-y-8">
          {faqs.map((group, gIdx) => (
            <div key={gIdx} className="bg-white border border-line rounded-sm p-6 md:p-8 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-charcoal pb-3 mb-4 border-b border-line">
                {group.category}
              </h3>

              <div className="space-y-3">
                {group.items.map((item, iIdx) => {
                  const currentIndex = `${gIdx}-${iIdx}`;
                  const isOpen = openIndex === currentIndex;

                  return (
                    <div
                      key={iIdx}
                      className="border border-line rounded-xs overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : currentIndex)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 bg-cream-2/20 hover:bg-cream-2/50 transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-xs sm:text-sm text-charcoal">
                          {item.q}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-rust transition-transform duration-300 shrink-0 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white text-xs sm:text-sm text-charcoal/75 leading-relaxed border-t border-line animate-fadeIn">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions Card */}
        <div className="mt-12 bg-charcoal text-cream p-8 rounded-sm text-center space-y-4">
          <h3 className="font-serif text-2xl font-bold">Still have questions?</h3>
          <p className="text-xs text-cream/70 max-w-md mx-auto">
            Our personal concierge styling team is available on WhatsApp to assist with fabric choices, sizing, and special wedding requests.
          </p>
          <a
            href="https://wa.me/9820785210"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rust text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-rust-deep transition-colors"
          >
            <MessageCircle size={16} />
            <span>Chat on WhatsApp (+91 98207 85210)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
