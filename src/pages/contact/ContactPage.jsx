import { useState, useMemo } from "react";
import { MessageCircle, Mail, MapPin, Send, CheckCircle2, PhoneCall, Clock, User, AlertCircle } from "lucide-react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useCart } from "../../context/CartContext.jsx";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import contactApi from "../../api/contactApi.js";
import useSEO from "../../hooks/useSEO.js";

export default function ContactPage() {
  const { showToast } = useCart();
  const { data: settings } = useBankDetailsQuery();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Dynamic Contact Info directly from Backend StoreSettings
  const contactPhone = settings?.whatsappNumber || settings?.contactPhone || "+91 9820785210";
  const contactEmail = settings?.supportEmail || settings?.contactEmail || "support@shreekamalinee.com";
  const contactAddress =
    settings?.contactAddress ||
    "Shreekamalinee Studio, Atelier Heritage Lane, Varanasi, Uttar Pradesh 221001, India";
  const operatingHours = settings?.operatingHours || "Monday to Saturday: 10:00 AM – 7:00 PM IST";

  const cleanPhone = contactPhone.replace(/\D/g, "");

  useSEO({
    title: "Contact Us & Atelier Concierge — Shreekamalinee",
    description: "Get in touch with Shreekamalinee. Contact our master weavers for orders, bespoke sizing, and product inquiries.",
  });

  const validateForm = () => {
    const errs = {};
    const name = form.name.trim();
    if (!name) {
      errs.name = "Full Name is required.";
    } else if (name.length < 2) {
      errs.name = "Name must be at least 2 characters long.";
    }

    const email = form.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errs.email = "Email Address is required.";
    } else if (!emailRegex.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    const cleanPhoneVal = form.phone ? form.phone.replace(/[^\d+]/g, "") : "";
    if (cleanPhoneVal && cleanPhoneVal !== "+" && cleanPhoneVal.length < 10) {
      errs.phone = "Please enter a complete phone number with country code.";
    }

    const subject = form.subject.trim();
    if (!subject) {
      errs.subject = "Subject is required.";
    } else if (subject.length < 3) {
      errs.subject = "Subject must be at least 3 characters.";
    }

    const message = form.message.trim();
    if (!message) {
      errs.message = "Message content is required.";
    } else if (message.length < 5) {
      errs.message = "Message must be at least 5 characters.";
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstErr = Object.values(errs)[0];
      showToast(firstErr, "warning");
      return false;
    }
    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await contactApi.submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      showToast("Dhanyawad! Your message has been received by our atelier concierge.", "success");
      setSubmittedSuccess(true);
      // Empty the form fields completely
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setErrors({});
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to submit message. Please try again or reach out on WhatsApp directly.",
        "warning"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-cream min-h-screen py-12 md:py-20">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-12 md:mb-16">
          <span className="text-[11px] tracking-[0.25em] uppercase text-rust font-semibold block mb-2">
            Artisanal Concierge
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight text-charcoal">
            Get in Touch
          </h1>
          <div className="w-16 h-0.5 bg-rust mx-auto mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* Left: Contact Info */}
          <div className="space-y-6">
            <div className="bg-white border border-line rounded-sm p-6 space-y-6 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-charcoal border-b border-line pb-3">
                Reach Our Atelier Directly
              </h3>

              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <MessageCircle size={19} className="stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-charcoal">WhatsApp Direct Concierge</h4>
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        "Namaste Shreekamalinee, I would like to inquire about your handloom sarees and bespoke collections."
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-800 font-bold hover:underline block mt-0.5"
                    >
                      {contactPhone}
                    </a>
                    <span className="text-[11px] text-charcoal/55">Instant assistance for drape advice and orders</span>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-rust/10 border border-rust/20 flex items-center justify-center text-rust shrink-0">
                    <Mail size={18} className="stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-charcoal">Email Support Desk</h4>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-xs text-rust font-bold hover:underline block mt-0.5"
                    >
                      {contactEmail}
                    </a>
                    <span className="text-[11px] text-charcoal/55">Response within 24 business hours</span>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-cream-2 border border-line flex items-center justify-center text-charcoal shrink-0">
                    <MapPin size={18} className="stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-charcoal">Studio & Atelier Address</h4>
                    <p className="text-xs text-charcoal/75 leading-relaxed mt-0.5">
                      {contactAddress}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-cream-2 border border-line flex items-center justify-center text-charcoal shrink-0">
                    <Clock size={18} className="stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-charcoal">Operating Hours</h4>
                    <p className="text-xs text-charcoal/75 leading-relaxed mt-0.5">
                      {operatingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertCircle size={17} className="text-amber-800 shrink-0 mt-0.5" />
              <span>
                <strong>Bespoke Customization Notice:</strong> For bridal weaves, blouse stitching adjustments, and zari customization, please include your timeline in the message.
              </span>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="bg-white p-6 sm:p-8 border border-line rounded-sm shadow-xs">
            <h3 className="font-serif text-xl font-bold mb-1 text-charcoal">Send Us an Inquiry</h3>
            <p className="text-xs text-charcoal/60 mb-5">
              Fill in your details below and our concierge team will connect with you.
            </p>

            {submittedSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 size={19} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="font-bold block text-sm">Message Dispatched Successfully</strong>
                  <span>Our artisanal concierge team has received your query and will reply within 24 hours.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Priya Sharma"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.name ? "border-rose-500 bg-rose-50/20" : "border-line focus:border-rust"
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    placeholder="priya@domain.com"
                    className={`w-full px-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                      errors.email ? "border-rose-500 bg-rose-50/20" : "border-line focus:border-rust"
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                    Contact Phone (Optional)
                  </label>
                  <div className="relative">
                    <PhoneInput
                      defaultCountry="in"
                      value={form.phone}
                      onChange={(phone) => {
                        setForm((prev) => ({ ...prev, phone }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      className="w-full text-xs"
                      inputClassName="!w-full !py-2.5 !px-3.5 !text-xs !bg-white !border-line !rounded-r-xs !font-medium !text-charcoal focus:!border-rust"
                      countrySelectorStyleProps={{
                        buttonClassName: "!bg-gray-50 !border-line !rounded-l-xs !px-2.5",
                      }}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                  Subject / Inquiry Topic *
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => {
                    setForm({ ...form, subject: e.target.value });
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
                  }}
                  placeholder="e.g. Banarasi Katan Saree Weave / Dispatch Inquiry"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.subject ? "border-rose-500 bg-rose-50/20" : "border-line focus:border-rust"
                  }`}
                />
                {errors.subject && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                  Message Details *
                </label>
                <textarea
                  rows="4"
                  value={form.message}
                  onChange={(e) => {
                    setForm({ ...form, message: e.target.value });
                    if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
                  }}
                  placeholder="Please describe your styling requirements, delivery timeline, or questions in detail..."
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium resize-none ${
                    errors.message ? "border-rose-500 bg-rose-50/20" : "border-line focus:border-rust"
                  }`}
                />
                {errors.message && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-rust hover:bg-rust-deep disabled:opacity-50 text-white text-[12px] tracking-widest uppercase font-semibold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-xs"
              >
                <span>{isSubmitting ? "Dispatching Message..." : "Submit Inquiry"}</span>
                <Send size={13} className="stroke-[2.2]" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}