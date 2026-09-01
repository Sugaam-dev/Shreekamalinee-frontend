import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Landmark,
  Copy,
  Upload,
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  QrCode,
  ShieldCheck,
  FileText,
  X,
  Check,
  Smartphone,
  User,
  MessageCircle,
} from "lucide-react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import { useBankDetailsQuery, useSubmitManualPaymentMutation, useUserOrderDetailQuery } from "../../queries/useOrderQueries.js";
import { validatePaymentDocument, ACCEPT_PAYMENT_DOC_STRING } from "../../utils/fileValidation.js";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";

export default function PaymentPage({ onComplete }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  const { cart, clearCart, showToast } = useCart();
  const { user, isAuthenticated } = useAuth();

  const { data: bankDetails } = useBankDetailsQuery();
  const { data: orderDetails, isLoading: isOrderLoading } = useUserOrderDetailQuery(orderId);
  const submitManualPaymentMutation = useSubmitManualPaymentMutation();

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    utr: "",
    file: null,
  });

  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Accurately resolve and prefill customer info from order or user session
  useEffect(() => {
    const rawPhone =
      orderDetails?.shippingAddress?.phoneNumber ||
      orderDetails?.shippingAddress?.phone ||
      user?.phoneNumber ||
      user?.phone ||
      "";

    let formattedPhone = rawPhone.trim();
    if (formattedPhone && !formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.length === 10 ? `+91${formattedPhone}` : `+91${formattedPhone}`;
    }

    const resolvedName =
      orderDetails?.shippingAddress?.fullName ||
      orderDetails?.shippingAddress?.name ||
      user?.fullName ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      user?.name ||
      "";

    const resolvedAddress = orderDetails?.shippingAddress
      ? `${orderDetails.shippingAddress.addressLine1 || ""}${
          orderDetails.shippingAddress.addressLine2 ? `, ${orderDetails.shippingAddress.addressLine2}` : ""
        }, ${orderDetails.shippingAddress.city || ""}, ${orderDetails.shippingAddress.state || ""} - ${
          orderDetails.shippingAddress.postalCode || ""
        }`
      : "";

    setForm((prev) => ({
      ...prev,
      name: resolvedName || prev.name,
      phone: formattedPhone || prev.phone,
      address: resolvedAddress || prev.address,
    }));
  }, [orderDetails, user]);

  // Clean up object URL on file change / unmount
  useEffect(() => {
    return () => {
      if (filePreview && typeof filePreview === "string" && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const totalAmount = useMemo(() => {
    return (
      orderDetails?.totalAmount ??
      orderDetails?.grandTotal ??
      cart.reduce((s, item) => s + (Number(item.price) || 0) * (item.qty || 1), 0)
    );
  }, [orderDetails, cart]);

  const activeBank = {
    bankName: bankDetails?.bankName || "HDFC Bank Limited",
    accountName: bankDetails?.accountHolderName || "Shreekamalinee Studio",
    accountNumber: bankDetails?.accountNumber || "50200067382109",
    ifscCode: bankDetails?.ifscCode || "HDFC0000003",
    branchName: bankDetails?.branchName || "Connaught Place, New Delhi",
    upiId: bankDetails?.upiId || "shreekamalinee@upi",
    qrCodeUrl: bankDetails?.qrCodeUrl || null,
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validation = validatePaymentDocument(selectedFile);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, file: validation.error }));
      showToast(validation.error, "warning");
      return;
    }

    setErrors((prev) => ({ ...prev, file: null }));
    setForm((prev) => ({ ...prev, file: selectedFile }));

    if (selectedFile.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
    } else {
      setFilePreview("pdf");
    }
  };

  const handleRemoveFile = () => {
    if (filePreview && typeof filePreview === "string" && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }
    setForm((prev) => ({ ...prev, file: null }));
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function validateForm(isPrepaid = true) {
    const errs = {};
    const name = form.name.trim();
    if (!name) {
      errs.name = "Full Name is required.";
    } else if (name.length < 2) {
      errs.name = "Full Name must be at least 2 characters long.";
    }

    const cleanPhone = form.phone.replace(/[^\d+]/g, "");
    if (!cleanPhone || cleanPhone === "+91" || cleanPhone === "+") {
      errs.phone = "Mobile contact number is required.";
    } else if (cleanPhone.length < 10) {
      errs.phone = "Please enter a valid complete mobile number.";
    }

    if (isPrepaid) {
      const utr = form.utr.trim();
      if (!utr) {
        errs.utr = "Transaction ID / UTR number is required for transfer verification.";
      } else if (utr.length < 12) {
        errs.utr = "UTR / UPI Reference number must be at least 12 digits (e.g. 423812345678).";
      } else if (utr.length > 22) {
        errs.utr = "UTR / Reference number cannot exceed 22 characters.";
      } else if (!/^[A-Z0-9]{12,22}$/.test(utr)) {
        errs.utr = "Invalid UTR format. Please enter alphanumeric characters only.";
      }

      if (!form.file) {
        errs.file = "Please attach your payment confirmation slip / screenshot.";
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

  async function handlePrepaidOrder(e) {
    e.preventDefault();
    if (!validateForm(true)) return;

    if (isAuthenticated && orderId) {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("utrNumber", form.utr.trim());
        if (form.file) {
          formData.append("receipt", form.file);
        }

        await submitManualPaymentMutation.mutateAsync({
          orderId,
          formData,
        });

        showToast("Payment proof uploaded successfully! Order queued for audit.", "success");
        clearCart();
        navigate(`/checkout/success?orderId=${orderId}`);
        return;
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to submit payment proof.", "warning");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      sendWhatsAppOrder("Prepaid (Direct Transfer Submitted)", form.utr);
    }
  }

  function handleCODOrder(e) {
    e.preventDefault();
    if (!validateForm(false)) return;
    sendWhatsAppOrder("Cash on Delivery (WhatsApp Verification)");
  }

  function sendWhatsAppOrder(paymentStatus, utrNumber = "") {
    // 1. Resolve Items Text
    let itemsList = [];
    if (orderDetails?.items && orderDetails.items.length > 0) {
      itemsList = orderDetails.items.map((item) => {
        const pName = item.productName || item.name || "Handloom Saree";
        const variantInfo = [
          item.size ? `Size: ${item.size}` : "",
          item.color ? `Color: ${item.color}` : "",
        ]
          .filter(Boolean)
          .join(", ");
        return `• *${pName}* (Qty: ${item.quantity || item.qty || 1}${
          variantInfo ? `, ${variantInfo}` : ""
        }) — ${formatCurrency((item.price || 0) * (item.quantity || item.qty || 1))}`;
      });
    } else if (cart && cart.length > 0) {
      itemsList = cart.map((item) => {
        const variantInfo = [
          item.selectedSize ? `Size: ${item.selectedSize}` : "",
          item.color ? `Color: ${item.color}` : "",
        ]
          .filter(Boolean)
          .join(", ");
        return `• *${item.name}* (Qty: ${item.qty}${
          variantInfo ? `, ${variantInfo}` : ""
        }) — ${formatCurrency((item.price || 0) * item.qty)}`;
      });
    }

    const itemsFormatted = itemsList.length > 0 ? itemsList.join("\n") : "• Authentic Handloom Saree Ensemble — " + formatCurrency(totalAmount);

    const orderRef = orderDetails?.orderNumber || (orderId ? (orderId.startsWith("SK-") ? orderId : `#${orderId.substring(0, 8).toUpperCase()}`) : "SK-PENDING");
    const subtotalVal = Number(orderDetails?.totalAmount ?? orderDetails?.subtotal ?? totalAmount);
    const discountVal = Number(orderDetails?.discountAmount || 0);

    const rawStorePhone = bankDetails?.whatsappNumber || bankDetails?.contactPhone || "919820785210";
    const cleanStorePhone = rawStorePhone.replace(/\D/g, "");

    const message = `🌸 *Shreekamalinee Studio — Payment & Order Verification* 🌸
-----------------------------------------
⚠️ *IMPORTANT SECURITY NOTICE:*
Please do NOT modify your Registered Account Email or Order Reference below. Any alteration will cause automated payment audit failure.
-----------------------------------------
👑 *Customer Name:* ${form.name.trim()}
📧 *Registered Account Email:* ${user?.email || "On File"}
📱 *Phone Number:* ${form.phone.trim()}
📍 *Delivery Address:* ${form.address.trim() || "On File"}

🛍️ *Order Items (${itemsList.length || 1}):*
${itemsFormatted}

💰 *Pricing Breakdown:*
• Items Subtotal: ${formatCurrency(subtotalVal)}
${discountVal > 0 ? `• Coupon Savings (${orderDetails?.couponCode || "VOUCHER"}): -${formatCurrency(discountVal)}\n` : ""}• Insured Delivery: FREE
-----------------------------------------
💎 *Net Total Paid:* ${formatCurrency(totalAmount)}
💳 *Payment Mode:* ${paymentStatus}${utrNumber ? `\n🔢 *UTR/Ref ID:* \`${utrNumber.trim()}\`` : ""}
🔖 *Order Reference:* *${orderRef}*
-----------------------------------------
Kindly verify receipt and dispatch schedule. Thank you!`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanStorePhone}?text=${encodedText}`;

    showToast("Opening WhatsApp Concierge...", "info");
    window.open(whatsappUrl, "_blank");
    clearCart();
    if (typeof onComplete === "function") {
      onComplete();
    } else {
      navigate("/");
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (orderId && isOrderLoading) {
    return (
      <div className="bg-cream min-h-screen py-24 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-rust/30 border-t-rust rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg text-charcoal">Loading Payment & Bank Details...</p>
      </div>
    );
  }

  if (!orderId && cart.length === 0) {
    return (
      <div className="bg-cream min-h-screen py-16 md:py-24 text-center">
        <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6">
          <ShoppingBag size={48} className="mx-auto text-charcoal/20 mb-4 stroke-[1.2]" />
          <h2 className="font-serif text-2xl font-bold mb-2 text-charcoal">Your bag is empty</h2>
          <p className="text-sm text-charcoal/60 mb-6">Please add handcrafted items to your bag before proceeding.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rust text-white text-xs tracking-wider uppercase font-semibold hover:bg-rust-deep transition-colors rounded-xs shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-6 sm:py-10 md:py-14">
      <div className="max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-3.5 sm:px-6 md:px-10 2xl:px-12">
        <Breadcrumb
          items={[
            { label: "Shopping Bag", to: "/cart" },
            { label: "Checkout", to: "/checkout" },
            { label: "Payment & Proof Verification" },
          ]}
        />

        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-rust font-semibold transition-colors cursor-pointer mb-3 mt-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Checkout</span>
        </button>

        {/* Page Header */}
        <div className="pb-4 mb-6 sm:mb-8 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-rust">
              Payment Confirmation
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal">
              {orderId ? `Verify Order #${orderId.substring(0, 8).toUpperCase()}` : "Direct Bank / UPI Transfer"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck size={14} />
            <span>100% Secure Payment Verification</span>
          </div>
        </div>


        <div className="grid lg:grid-cols-[1.3fr_1fr] 2xl:grid-cols-[1.5fr_1fr] gap-6 lg:gap-10 2xl:gap-14 items-start">
          {/* Left Column: Bank Details & QR Code */}
          <div className="space-y-6">
            {/* Amount Banner */}
            <div className="bg-white border border-line rounded-sm p-4 sm:p-6 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-charcoal/60 font-semibold block mb-0.5">
                  Total Payable Amount
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
                  {formatCurrency(totalAmount)}
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Zero Surcharge
              </span>
            </div>

            {/* Transfer Options (QR + Bank) */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Option A: UPI QR Code */}
              <div className="bg-white p-5 sm:p-6 border border-line rounded-sm shadow-xs flex flex-col justify-between items-center text-center">
                <div className="w-full">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                    <QrCode size={16} className="text-rust" />
                    <span>Option A: Scan UPI QR</span>
                  </div>
                  <p className="text-[11.5px] text-charcoal/60 mb-4">GooglePay, PhonePe, Paytm, BHIM</p>
                </div>

                {/* QR Code Container */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 border border-line bg-cream-2/30 p-3 rounded-sm flex items-center justify-center relative shadow-inner overflow-hidden mb-4">
                  {activeBank.qrCodeUrl ? (
                    <img
                      src={activeBank.qrCodeUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-3">
                      <QrCode size={64} className="mx-auto text-charcoal/30 mb-2 stroke-[1.2]" />
                      <span className="text-[10.5px] font-bold text-rust uppercase tracking-wider block">
                        Shreekamalinee UPI
                      </span>
                    </div>
                  )}
                </div>

                {/* UPI ID Copy Box */}
                <div className="w-full">
                  <span className="block text-[10.5px] uppercase font-bold tracking-wider text-charcoal/50 mb-1">
                    Official Store UPI ID
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeBank.upiId);
                      setCopiedUpi(true);
                      showToast("UPI ID copied to clipboard!", "success");
                      setTimeout(() => setCopiedUpi(false), 2500);
                    }}
                    className="w-full py-2 px-3 bg-cream-2/40 hover:bg-cream-2 border border-line rounded-xs text-xs font-mono font-bold text-charcoal flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="truncate">{activeBank.upiId}</span>
                    {copiedUpi ? (
                      <Check size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Copy size={13} className="text-charcoal/50 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Option B: Bank Transfer */}
              <div className="bg-white p-5 sm:p-6 border border-line rounded-sm shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                    <Landmark size={16} className="text-rust" />
                    <span>Option B: Bank Transfer</span>
                  </div>
                  <p className="text-[11.5px] text-charcoal/60 mb-4">NEFT, IMPS, RTGS Transfer</p>

                  <div className="space-y-3 pt-3 border-t border-line/70 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal/50 block">
                        Bank Name
                      </span>
                      <strong className="text-charcoal font-semibold">{activeBank.bankName}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal/50 block">
                        Account Holder
                      </span>
                      <strong className="text-charcoal font-serif">{activeBank.accountName}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal/50 block">
                        Account Number
                      </span>
                      <strong className="text-charcoal font-mono tracking-wider">{activeBank.accountNumber}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal/50 block">
                        IFSC Code
                      </span>
                      <strong className="text-rust font-mono font-bold tracking-wider">{activeBank.ifscCode}</strong>
                    </div>

                    {activeBank.branchName && (
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal/50 block">
                          Branch
                        </span>
                        <span className="text-charcoal/70 text-[11.5px]">{activeBank.branchName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-line/70 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `A/C: ${activeBank.accountNumber}, IFSC: ${activeBank.ifscCode}, Name: ${activeBank.accountName}, Bank: ${activeBank.bankName}`
                      );
                      setCopiedBank(true);
                      showToast("Bank details copied to clipboard!", "success");
                      setTimeout(() => setCopiedBank(false), 2500);
                    }}
                    className="w-full py-2 px-3 bg-cream-2/40 hover:bg-cream-2 border border-line rounded-xs text-xs font-bold text-charcoal flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedBank ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-charcoal/50" />
                        <span>Copy All Bank Info</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Verification & Proof Submission Form */}
          <div className="bg-white border border-line rounded-sm p-5 sm:p-7 shadow-xs">
            <div className="pb-4 mb-5 border-b border-line">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-charcoal">
                Submit Payment Verification
              </h3>
              <p className="text-xs text-charcoal/60 mt-1">
                Enter your transaction reference number and attach your payment receipt screenshot.
              </p>
            </div>

            <form onSubmit={handlePrepaidOrder} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="Enter full recipient name"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                      errors.name ? "border-rose-500 bg-rose-50/20" : "border-line focus:border-rust"
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* Mobile Contact Number with Flag Picker */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                  Mobile Contact Number *
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

              {/* UTR / Reference ID */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                  12-Digit UTR / Transaction Reference ID *
                </label>
                <input
                  type="text"
                  maxLength={22}
                  value={form.utr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                    setForm({ ...form, utr: clean });
                    if (errors.utr) setErrors((prev) => ({ ...prev, utr: null }));
                  }}
                  placeholder="e.g. 423589123456 (12-digit UPI Ref)"
                  className={`w-full px-3.5 py-2.5 text-xs font-mono border rounded-xs outline-none bg-white uppercase font-bold tracking-wider ${
                    errors.utr ? "border-rose-500 bg-rose-50/20" : "border-line focus:border-rust"
                  }`}
                />
                <span className="text-[10.5px] text-charcoal/50 mt-1 block">
                  Find the 12-digit UPI Ref/UTR in Google Pay, PhonePe, Paytm, or your banking app.
                </span>
                {errors.utr && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.utr}</p>}
              </div>

              {/* Interactive Proof Slip Upload & Live Preview */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                  Payment Screenshot (Proof Slip) *
                </label>

                {filePreview ? (
                  /* Uploaded File Preview Card */
                  <div className="border border-emerald-200 bg-emerald-50/40 rounded-xs p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {filePreview === "pdf" ? (
                        <div className="w-12 h-14 bg-rose-100 text-rose-700 rounded-xs flex items-center justify-center shrink-0 border border-rose-200">
                          <FileText size={22} />
                        </div>
                      ) : (
                        <div className="w-12 h-14 rounded-xs overflow-hidden border border-emerald-300 shrink-0 bg-white">
                          <img
                            src={filePreview}
                            alt="Receipt Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-charcoal truncate block">
                            {form.file?.name}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-charcoal/60 block mt-0.5">
                          {formatFileSize(form.file?.size)} • Ready to submit
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-bold text-rust hover:bg-rust/10 rounded-xs transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 text-charcoal/40 hover:text-rose-600 rounded-xs transition-colors cursor-pointer"
                        title="Remove Slip"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Upload Dropzone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xs p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-rust bg-rust/5 scale-[1.01]"
                        : errors.file
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-line bg-cream-2/30 hover:border-rust/60 hover:bg-cream-2/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-2 text-rust shadow-2xs">
                      <Upload size={18} />
                    </div>
                    <span className="text-xs font-bold text-charcoal block mb-0.5">
                      Click to upload or drag & drop payment proof
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/80 border border-line rounded text-[10px] text-charcoal/70 font-medium mt-1">
                      <span>PNG, JPG, WebP, GIF, PDF</span>
                      <span>•</span>
                      <span>Max 10 MB</span>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_PAYMENT_DOC_STRING}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className="hidden"
                />
                {errors.file && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.file}</p>}
              </div>

              {/* Submit Verification Action */}
              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-rust hover:bg-rust-deep text-white text-xs tracking-wider uppercase font-bold rounded-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Submitting Payment Proof...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} />
                      <span>Confirm & Submit Payment Proof</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-charcoal/60 text-center leading-relaxed">
                  Upon submission, our accounts team will verify your UTR reference and confirm your order dispatch.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

