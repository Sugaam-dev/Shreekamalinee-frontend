import { useState } from "react";
import { Landmark, Copy, Upload, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";

export default function PaymentPage({ onComplete }) {
  const { cart, clearCart, showToast } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", utr: "", file: null });
  const [errors, setErrors] = useState({});

  const totalAmount = cart.reduce((s, item) => s + item.price * item.qty, 0);

  function validateForm(isPrepaid) {
    const errs = {};
    const name = form.name.trim();
    if (!name) {
      errs.name = "Full Name is required.";
    } else if (name.length < 2) {
      errs.name = "Full Name must be at least 2 characters long.";
    }

    const phone = form.phone.trim().replace(/\D/g, "");
    if (!phone) {
      errs.phone = "Phone number is required.";
    } else {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        errs.phone = "Enter a valid 10-digit mobile number.";
      }
    }

    const address = form.address.trim();
    if (!address) {
      errs.address = "Delivery address is required.";
    } else if (address.length < 10) {
      errs.address = "Please enter a complete address with PIN code (at least 10 characters).";
    }

    if (isPrepaid) {
      const utr = form.utr.trim();
      if (!utr) {
        errs.utr = "Transaction ID / UTR number is required for prepaid verification.";
      } else {
        const utrRegex = /^[a-zA-Z0-9]{6,18}$/;
        if (!utrRegex.test(utr)) {
          errs.utr = "Enter a valid UTR number (6-18 characters).";
        }
      }
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstErr = Object.values(errs)[0];
      showToast(firstErr, "warning");
      return false;
    }

    return true;
  }

  function handlePrepaidOrder(e) {
    e.preventDefault();
    if (!validateForm(true)) return;
    sendWhatsAppOrder("Prepaid (Transfer Verification Submitted)", form.utr);
  }

  function handleCODOrder(e) {
    e.preventDefault();
    if (!validateForm(false)) return;
    sendWhatsAppOrder("COD / Pay Later on WhatsApp");
  }

  function sendWhatsAppOrder(paymentStatus, utrNumber = "") {
    const itemsText = cart
      .map((item) => `- ${item.name} x ${item.qty} — ₹${(item.price * item.qty).toLocaleString("en-IN")}`)
      .join("\n");

    const message = `🌸 *Shreekamalinee STUDIO - NEW ORDER* 🌸
-----------------------------------------
👤 *Customer Name:* ${form.name.trim()}
📞 *Phone Number:* ${form.phone.trim()}
📍 *Delivery Address:* ${form.address.trim()}

🛍️ *Order Details:*
${itemsText}
-----------------------------------------
💰 *Subtotal:* ₹${totalAmount.toLocaleString("en-IN")}
🚚 *Shipping:* Free Shipping
💵 *Grand Total:* ₹${totalAmount.toLocaleString("en-IN")}

💳 *Payment Information:*
Status: *${paymentStatus}*${utrNumber ? `\nUTR/Transaction ID: \`${utrNumber.trim()}\`` : ""}
-----------------------------------------
Thank you for shopping with Shreekamalinee!`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/9820785210?text=${encodedText}`;
    
    showToast("Redirecting to WhatsApp to complete order...");
    window.open(whatsappUrl, "_blank");
    clearCart(); // Clear the cart when order is successfully completed!
    onComplete(); // Go back home
  }

  if (cart.length === 0) {
    return (
      <div className="bg-cream min-h-screen py-16 md:py-24 text-center">
        <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6">
          <ShoppingBag size={48} className="mx-auto text-charcoal/20 mb-4 stroke-[1.2]" />
          <h2 className="font-serif text-2xl font-bold mb-4">Your bag is empty</h2>
          <p className="text-sm text-charcoal/60 mb-6">Please add items to your cart before proceeding to payment.</p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-rust text-white text-[12.5px] tracking-wider uppercase font-semibold hover:bg-rust-deep transition-colors cursor-pointer flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={14} className="stroke-[2.2]" />
            <span>Go Back Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-16 md:py-24">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
        
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[11px] tracking-[0.25em] uppercase text-rust font-semibold block mb-3">
            Secure Payment Gateway
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight text-charcoal">
            Verify Transfer
          </h1>
          <div className="w-16 h-0.5 bg-rust mx-auto mt-6" />
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
          
          {/* Left Column: QR Code & Bank Details */}
          <div className="space-y-8">
            {/* Cart summary header */}
            <div className="bg-cream-2/40 p-6 border border-line rounded-sm flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal">Order Amount to Pay</h3>
                <span className="text-xs text-charcoal/50">Includes all applicable taxes</span>
              </div>
              <span className="text-2xl font-bold text-rust">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Option 1: QR Code */}
              <div className="bg-white p-6 border border-line rounded-sm text-center shadow-xs flex flex-col justify-between items-center">
                <div>
                  <h4 className="font-serif text-base font-bold mb-1 text-charcoal">Option A: Scan UPI QR</h4>
                  <p className="text-[12px] text-charcoal/50 mb-6">Scan using GooglePay, PhonePe, Paytm</p>
                </div>
                
                {/* Mock QR Code graphic */}
                <div className="w-44 h-44 border border-line bg-cream-2/30 p-3 rounded-sm relative flex items-center justify-center mb-6">
                  {/* Outer QR layout */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-charcoal" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-charcoal" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-charcoal" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-charcoal" />
                  {/* Central QR block */}
                  <div className="w-24 h-24 grid grid-cols-5 gap-1 opacity-80">
                    {[...Array(25)].map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 3 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24)
                            ? "bg-charcoal"
                            : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="absolute text-[10px] tracking-widest bg-rust text-white font-bold px-2 py-0.5 shadow-xs uppercase">
                    Shreekamalinee UPI
                  </span>
                </div>

                <div className="w-full">
                  <span className="block text-[11px] uppercase tracking-wider text-charcoal/40 font-medium mb-1.5">UPI ID</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Shreekamalinee@upi");
                      showToast("UPI ID Copied to Clipboard!");
                    }}
                    className="w-full py-2 bg-cream hover:bg-cream-2 text-[12.5px] border border-line rounded-sm font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Shreekamalinee@upi</span>
                    <Copy size={13} className="stroke-[1.8]" />
                  </button>
                </div>
              </div>

              {/* Option 2: Bank Details */}
              <div className="bg-white p-6 border border-line rounded-sm shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-base font-bold mb-1 text-charcoal">Option B: Bank Transfer</h4>
                  <p className="text-[12px] text-charcoal/50 mb-6">Initiate IMPS, NEFT, or RTGS transfer</p>
                </div>

                <div className="space-y-4 border-t border-line pt-4 mb-4">
                  <div>
                    <span className="block text-[10.5px] uppercase tracking-wider text-charcoal/40 font-medium">Bank Name</span>
                    <strong className="text-[13.5px] text-charcoal">HDFC Bank Limited</strong>
                  </div>
                  <div>
                    <span className="block text-[10.5px] uppercase tracking-wider text-charcoal/40 font-medium">Account Name</span>
                    <strong className="text-[13.5px] text-charcoal font-serif">Shreekamalinee Studio</strong>
                  </div>
                  <div>
                    <span className="block text-[10.5px] uppercase tracking-wider text-charcoal/40 font-medium">Account Number</span>
                    <strong className="text-[13.5px] text-charcoal tracking-wider">50200067382109</strong>
                  </div>
                  <div>
                    <span className="block text-[10.5px] uppercase tracking-wider text-charcoal/40 font-medium">IFSC Code</span>
                    <strong className="text-[13.5px] text-charcoal tracking-wide">HDFC0000003</strong>
                  </div>
                  <div>
                    <span className="block text-[10.5px] uppercase tracking-wider text-charcoal/40 font-medium">Branch</span>
                    <p className="text-[12.5px] text-charcoal/70">Connaught Place, New Delhi</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText("A/C: 50200067382109, IFSC: HDFC0000003");
                    showToast("Bank details copied!");
                  }}
                  className="w-full py-2 bg-cream hover:bg-cream-2 text-[12.5px] border border-line rounded-sm font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Copy Account Info</span>
                  <Copy size={13} className="stroke-[1.8]" />
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Transaction Submission Form */}
          <div className="bg-white p-8 border border-line rounded-sm shadow-sm">
            <h3 className="font-serif text-xl font-bold mb-2 text-charcoal">Checkout & Verification</h3>
            <p className="text-xs text-charcoal/50 mb-6">
              Please enter your shipping address and submit your order details via WhatsApp.
            </p>

            <form onSubmit={handlePrepaidOrder} noValidate className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-charcoal/60 mb-2 font-medium">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="Enter recipient's name"
                  className={`w-full px-4 py-3 border bg-cream text-sm outline-none transition-colors ${
                    errors.name ? "border-rose-500 focus:border-rose-600 bg-rose-50/30" : "border-line focus:border-rust"
                  }`}
                />
                {errors.name && <p className="text-[11.5px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-charcoal/60 mb-2 font-medium">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                  placeholder="10-digit mobile number"
                  className={`w-full px-4 py-3 border bg-cream text-sm outline-none transition-colors ${
                    errors.phone ? "border-rose-500 focus:border-rose-600 bg-rose-50/30" : "border-line focus:border-rust"
                  }`}
                />
                {errors.phone && <p className="text-[11.5px] text-rose-600 mt-1 font-medium">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-charcoal/60 mb-2 font-medium">Delivery Address *</label>
                <textarea
                  rows="3"
                  value={form.address}
                  onChange={(e) => {
                    setForm({ ...form, address: e.target.value });
                    if (errors.address) setErrors({ ...errors, address: null });
                  }}
                  placeholder="Enter full shipping address with state and PIN code"
                  className={`w-full px-4 py-3 border bg-cream text-sm outline-none resize-none transition-colors ${
                    errors.address ? "border-rose-500 focus:border-rose-600 bg-rose-50/30" : "border-line focus:border-rust"
                  }`}
                />
                {errors.address && <p className="text-[11.5px] text-rose-600 mt-1 font-medium">{errors.address}</p>}
              </div>

              <div className="pt-2 border-t border-line/60">
                <span className="block text-[11px] uppercase tracking-wider text-charcoal/40 font-bold mb-3">Prepaid Verification (UPI/Bank)</span>
                <label className="block text-xs uppercase tracking-wider text-charcoal/60 mb-2 font-medium">UTR / Transaction ID</label>
                <input
                  type="text"
                  value={form.utr}
                  onChange={(e) => {
                    setForm({ ...form, utr: e.target.value });
                    if (errors.utr) setErrors({ ...errors, utr: null });
                  }}
                  placeholder="12-digit transaction ID (if paid online)"
                  className={`w-full px-4 py-3 border bg-cream text-sm outline-none tracking-wider transition-colors ${
                    errors.utr ? "border-rose-500 focus:border-rose-600 bg-rose-50/30" : "border-line focus:border-rust"
                  }`}
                />
                {errors.utr && <p className="text-[11.5px] text-rose-600 mt-1 font-medium">{errors.utr}</p>}
              </div>

              {/* Upload Receipt Screenshot Section (Commented out)
              <div>
                <label className="block text-xs uppercase tracking-wider text-charcoal/60 mb-2 font-medium">
                  Upload Receipt Screenshot (Optional)
                </label>
                <div className="border border-dashed border-line p-4 rounded-sm text-center bg-cream-2/20 flex flex-col items-center justify-center gap-2">
                  <Upload size={20} className="text-charcoal/30 stroke-[1.8]" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                    className="text-xs text-charcoal/50 w-full cursor-pointer"
                  />
                  <span className="block text-[10px] text-charcoal/40">PNG, JPG up to 5MB</span>
                </div>
                
                <div className="mt-3 p-3 bg-rust/5 border border-rust/10 rounded-sm text-[11.5px] leading-relaxed text-rust-deep flex items-start gap-2 animate-fadeIn">
                  <span className="shrink-0 text-xs">💡</span>
                  <p>
                    <strong>Note:</strong> Since WhatsApp does not allow files to be attached automatically through links, please <strong>manually attach/paste</strong> your payment receipt screenshot inside the WhatsApp chat after it opens.
                  </p>
                </div>
              </div>
              */}

              <div className="space-y-3 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-rust hover:bg-rust-deep text-white text-[12.5px] tracking-widest uppercase font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Confirm Prepaid Order via WhatsApp
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line"></div></div>
                  <span className="relative px-3 bg-white text-[10px] text-charcoal/40 uppercase font-semibold tracking-wider">or</span>
                </div>

                <button
                  type="button"
                  onClick={handleCODOrder}
                  className="w-full py-4 bg-charcoal hover:bg-charcoal/90 text-cream text-[12.5px] tracking-widest uppercase font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Order via WhatsApp (COD / Pay Later)
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
