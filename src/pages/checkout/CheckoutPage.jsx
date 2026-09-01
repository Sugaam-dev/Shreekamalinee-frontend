import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  Lock,
  Plus,
  ShoppingBag,
  Tag,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAvailableCouponsQuery } from "../../queries/useCouponQueries.js";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import { formatCurrency } from "../../utils/formatters.js";
import {
  useAddressesQuery,
  useAddAddressMutation,
} from "../../queries/useAddressQueries.js";
import {
  useCreateOrderMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "../../queries/useOrderQueries.js";
import AddressCard from "../../components/cards/AddressCard.jsx";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import useSEO from "../../hooks/useSEO.js";
import { INDIAN_STATES } from "../../utils/constants.js";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { validators } from "../../utils/validation.js";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const directBuyItem = location.state?.directBuyItem || location.state?.buyNowItem;

  const { data: availableCoupons = [] } = useAvailableCouponsQuery();
  const { data: storeSettings } = useBankDetailsQuery();

  const isUpiPaymentActive = storeSettings?.isUpiPaymentActive ?? true;
  const isRazorpayPaymentActive = storeSettings?.isRazorpayPaymentActive ?? true;
  const isCodPaymentActive = storeSettings?.isCodPaymentActive ?? true;
  const isWhatsappOrderActive = storeSettings?.isWhatsappOrderActive ?? true;

  const minDeliveryDays = storeSettings?.estimatedDeliveryDaysMin ?? 3;
  const maxDeliveryDays = storeSettings?.estimatedDeliveryDaysMax ?? 5;

  const estimatedDeliveryRange = useMemo(() => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDeliveryDays);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDeliveryDays);

    const options = { day: "numeric", month: "short" };
    return `${minDate.toLocaleDateString("en-IN", options)} - ${maxDate.toLocaleDateString("en-IN", options)}`;
  }, [minDeliveryDays, maxDeliveryDays]);

  const validCoupons = useMemo(() => {
    if (!Array.isArray(availableCoupons)) return [];
    return [...availableCoupons].sort((a, b) => {
      const isAInactive = Boolean(a.isUsedByUser || a.isExpired || a.active === false);
      const isBInactive = Boolean(b.isUsedByUser || b.isExpired || b.active === false);
      if (isAInactive !== isBInactive) {
        return isAInactive ? 1 : -1;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [availableCoupons]);

  const {
    cart,
    selectedCartItems,
    removePurchasedItems,
    subtotal,
    appliedCoupon,
    discountAmount,
    freeShippingThreshold = 1499,
    standardShippingFee = 99,
    isFreeShippingPromo = false,
    applyCouponCode,
    removeCouponCode,
    showToast,
  } = useCart();

  const [checkoutCouponInput, setCheckoutCouponInput] = useState("");

  const { user, isAuthenticated } = useAuth();

  const checkoutItems = useMemo(() => {
    if (directBuyItem) return [directBuyItem];
    return selectedCartItems.length > 0 ? selectedCartItems : cart;
  }, [directBuyItem, selectedCartItems, cart]);

  const checkoutSubtotal = useMemo(() => {
    if (directBuyItem) {
      return (Number(directBuyItem.price) || 0) * (Number(directBuyItem.qty) || 1);
    }
    return subtotal;
  }, [directBuyItem, subtotal]);

  const checkoutDiscount = useMemo(() => {
    if (!appliedCoupon || checkoutSubtotal === 0) return 0;
    if (typeof appliedCoupon.discountAmount === "number" && appliedCoupon.discountAmount > 0) {
      return Math.min(appliedCoupon.discountAmount, checkoutSubtotal);
    }
    if (typeof appliedCoupon.calculatedDiscount === "number" && appliedCoupon.calculatedDiscount > 0) {
      return Math.min(appliedCoupon.calculatedDiscount, checkoutSubtotal);
    }
    if (appliedCoupon.discountType === "PERCENTAGE" && appliedCoupon.discountValue) {
      const calculated = (checkoutSubtotal * Number(appliedCoupon.discountValue)) / 100;
      return appliedCoupon.maxDiscountAmount ? Math.min(calculated, Number(appliedCoupon.maxDiscountAmount)) : calculated;
    }
    if (appliedCoupon.discountType === "FIXED" && appliedCoupon.discountValue) {
      return Math.min(Number(appliedCoupon.discountValue), checkoutSubtotal);
    }
    return discountAmount;
  }, [appliedCoupon, checkoutSubtotal, discountAmount]);

  const codHandlingFee = storeSettings?.codHandlingFee != null ? Number(storeSettings.codHandlingFee) : 99;
  const freeCodThreshold = storeSettings?.freeCodThreshold != null ? Number(storeSettings.freeCodThreshold) : 2999;
  const isCodFree = checkoutSubtotal >= freeCodThreshold;

  const checkoutShipping = useMemo(() => {
    if (isFreeShippingPromo || checkoutSubtotal >= freeShippingThreshold || checkoutSubtotal === 0) {
      return 0;
    }
    return standardShippingFee;
  }, [isFreeShippingPromo, checkoutSubtotal, freeShippingThreshold, standardShippingFee]);

  // Determine initial active payment method
  const initialPaymentMethod = useMemo(() => {
    if (isRazorpayPaymentActive) return "RAZORPAY";
    if (isUpiPaymentActive) return "UPI_DIRECT";
    if (isCodPaymentActive) return "COD";
    if (isWhatsappOrderActive) return "WHATSAPP";
    return "RAZORPAY";
  }, [isRazorpayPaymentActive, isUpiPaymentActive, isCodPaymentActive, isWhatsappOrderActive]);

  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dedicated COD Modal State
  const [isCodModalOpen, setIsCodModalOpen] = useState(false);
  const [isCodAgreed, setIsCodAgreed] = useState(false);

  const effectiveCodFee = paymentMethod === "COD" ? (isCodFree ? 0 : codHandlingFee) : 0;
  const checkoutGrandTotal = Math.max(0, checkoutSubtotal - checkoutDiscount + checkoutShipping + effectiveCodFee);

  const { data: dbAddresses = [] } = useAddressesQuery(isAuthenticated);
  const addAddressMutation = useAddAddressMutation();
  const createOrderMutation = useCreateOrderMutation();
  const createRazorpayOrderMutation = useCreateRazorpayOrderMutation();
  const verifyRazorpayPaymentMutation = useVerifyRazorpayPaymentMutation();

  useSEO({
    title: "Secure Checkout — Shreekamalinee",
    description: "Complete your order with end-to-end encryption.",
  });

  const [localAddresses, setLocalAddresses] = useState([]);
  const addresses = isAuthenticated && dbAddresses.length > 0 ? dbAddresses : localAddresses;

  const [selectedAddressId, setSelectedAddressId] = useState(() => addresses[0]?.id || "");

  // Automatically select default or first address when loaded from PostgreSQL backend
  useEffect(() => {
    if (addresses.length > 0 && (!selectedAddressId || !addresses.some((a) => a.id === selectedAddressId))) {
      const defaultAddr = addresses.find((a) => a.isDefault || a.default);
      setSelectedAddressId(defaultAddr?.id || addresses[0]?.id || "");
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (paymentMethod === "RAZORPAY" && !isRazorpayPaymentActive) {
      if (isUpiPaymentActive) setPaymentMethod("UPI_DIRECT");
      else if (isCodPaymentActive) setPaymentMethod("COD");
      else if (isWhatsappOrderActive) setPaymentMethod("WHATSAPP");
    } else if (paymentMethod === "UPI_DIRECT" && !isUpiPaymentActive) {
      if (isRazorpayPaymentActive) setPaymentMethod("RAZORPAY");
      else if (isCodPaymentActive) setPaymentMethod("COD");
      else if (isWhatsappOrderActive) setPaymentMethod("WHATSAPP");
    } else if (paymentMethod === "COD" && !isCodPaymentActive) {
      if (isRazorpayPaymentActive) setPaymentMethod("RAZORPAY");
      else if (isUpiPaymentActive) setPaymentMethod("UPI_DIRECT");
      else if (isWhatsappOrderActive) setPaymentMethod("WHATSAPP");
    } else if (paymentMethod === "WHATSAPP" && !isWhatsappOrderActive) {
      if (isRazorpayPaymentActive) setPaymentMethod("RAZORPAY");
      else if (isUpiPaymentActive) setPaymentMethod("UPI_DIRECT");
      else if (isCodPaymentActive) setPaymentMethod("COD");
    }
  }, [isRazorpayPaymentActive, isUpiPaymentActive, isCodPaymentActive, isWhatsappOrderActive, paymentMethod]);

  const userFullName = user
    ? (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.name || "")
    : "";
  const userPhone = (user?.phoneNumber || user?.phone || "").replace(/^\+91/, "").trim();

  // Add Address Modal state
  const [newAddressModalOpen, setNewAddressModalOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    name: userFullName,
    phone: userPhone,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    country: "India",
    addressType: "Home",
  });

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const handleOpenAddAddressModal = () => {
    setNewAddressForm({
      name: userFullName,
      phone: userPhone,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "Maharashtra",
      pincode: "",
      country: "India",
      addressType: "Home",
    });
    setNewAddressModalOpen(true);
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    const phoneError = validators.phone(newAddressForm.phone);
    if (phoneError) {
      showToast(phoneError, "warning");
      return;
    }

    if (
      !newAddressForm.name.trim() ||
      !newAddressForm.addressLine1.trim() ||
      !newAddressForm.city.trim() ||
      !newAddressForm.state.trim() ||
      !newAddressForm.pincode.trim()
    ) {
      showToast("Please fill all required address fields", "warning");
      return;
    }

    const cleanPhone = newAddressForm.phone.replace(/[^\d+]/g, "").trim();

    const payload = {
      fullName: newAddressForm.name.trim(),
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      streetAddress: (newAddressForm.addressLine1.trim() + (newAddressForm.addressLine2 ? `, ${newAddressForm.addressLine2.trim()}` : "")).trim(),
      addressLine1: newAddressForm.addressLine1.trim(),
      addressLine2: newAddressForm.addressLine2 ? newAddressForm.addressLine2.trim() : "",
      city: newAddressForm.city.trim(),
      state: newAddressForm.state.trim(),
      pinCode: newAddressForm.pincode.trim(),
      postalCode: newAddressForm.pincode.trim(),
      country: "India",
      addressType: newAddressForm.addressType,
      isDefault: addresses.length === 0,
    };

    if (isAuthenticated) {
      try {
        const res = await addAddressMutation.mutateAsync(payload);
        if (res?.id) {
          setSelectedAddressId(res.id);
        }
        setNewAddressModalOpen(false);
        showToast("New delivery address saved", "success");
        return;
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to save address to server", "warning");
      }
    }

    const created = {
      ...payload,
      name: payload.fullName,
      phone: payload.phoneNumber,
      pincode: payload.postalCode,
      id: "ADDR-" + Date.now(),
      isDefault: addresses.length === 0,
    };

    setLocalAddresses((prev) => [...prev, created]);
    setSelectedAddressId(created.id);
    setNewAddressModalOpen(false);
    showToast("New delivery address added", "success");
  };


  const handleWhatsAppOrderSubmit = () => {
    if (!selectedAddress) {
      showToast("Please select or add a delivery address to complete your order inquiry.", "warning");
      return;
    }

    if (checkoutItems.length === 0) {
      showToast("Your checkout bag is empty.", "warning");
      return;
    }

    const rawStorePhone = storeSettings?.whatsappNumber || storeSettings?.contactPhone || "918329683648";
    const cleanStorePhone = rawStorePhone.replace(/\D/g, "");

    const customerEmail = user?.email || selectedAddress?.email || "";
    const emailLine = customerEmail ? `\n📧 Email: ${customerEmail}` : "";

    const addressText = selectedAddress
      ? `${selectedAddress.fullName || selectedAddress.name || userFullName || "Patron"}\n📍 ${selectedAddress.addressLine1 || ""}${selectedAddress.addressLine2 ? ", " + selectedAddress.addressLine2 : ""}, ${selectedAddress.city || ""}, ${selectedAddress.state || ""} - ${selectedAddress.postalCode || selectedAddress.pincode || ""}\n📞 Phone: ${selectedAddress.phoneNumber || selectedAddress.phone || userPhone || ""}${emailLine}`
      : `Address on file${emailLine}`;

    const itemsList = checkoutItems
      .map(
        (item, idx) =>
          `• ${idx + 1}. *${item.name || item.title || "Handloom Saree"}*\n   Qty: ${item.qty || item.quantity || 1} × ${formatCurrency(item.price || 0)}${item.selectedSize && item.selectedSize !== "Standard" ? ` | Size: ${item.selectedSize}` : ""}${item.color ? ` | Color: ${item.color}` : ""}`
      )
      .join("\n");

    const discountText = checkoutDiscount > 0
      ? `\n• *Coupon Discount (${appliedCoupon?.code || "PROMO"}):* -${formatCurrency(checkoutDiscount)}`
      : "";

    const shippingDisplay = checkoutShipping === 0 ? "FREE (Insured)" : formatCurrency(checkoutShipping);

    const message = `👑 *NEW ORDER BOOKING — SHREEKAMALINEE*
----------------------------------------
🛍️ *Order Items (${checkoutItems.length}):*
${itemsList}

📊 *Price Calculation Breakdown:*
• *Subtotal:* ${formatCurrency(checkoutSubtotal)}${discountText}
• *Insured Shipping:* ${shippingDisplay}
----------------------------------------
💎 *Net Total Payable:* ${formatCurrency(checkoutGrandTotal)}
----------------------------------------
📍 *Customer & Delivery Details:*
${addressText}

💬 *Customer Note:* I would like to confirm my order booking and complete payment via WhatsApp Concierge.`;

    const waUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(message)}`;
    showToast("Opening WhatsApp with your complete order breakdown...", "info");
    window.open(waUrl, "_blank");
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "WHATSAPP") {
      handleWhatsAppOrderSubmit();
      return;
    }

    if (!selectedAddress) {
      showToast("Please select or add a delivery address.", "warning");
      return;
    }

    if (checkoutItems.length === 0) {
      showToast("Your checkout bag is empty.", "warning");
      return;
    }

    setIsProcessing(true);

    try {
      if (isAuthenticated) {
        const mappedPaymentMethod = paymentMethod === "UPI_DIRECT" ? "MANUAL" : paymentMethod;
        const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const orderData = {
          shippingAddressId: selectedAddress.id,
          couponCode: appliedCoupon?.code || undefined,
          paymentMethod: mappedPaymentMethod,
          ...(directBuyItem
            ? {
                directItem: {
                  productId: directBuyItem.productId,
                  variantId: directBuyItem.variantId || undefined,
                  quantity: directBuyItem.qty || 1,
                  size: directBuyItem.size || undefined,
                  color: directBuyItem.color || undefined,
                },
              }
            : {
                selectedCartItemIds: checkoutItems.map((i) => i.serverItemId || i.id),
              }),
        };

        const orderResponse = await createOrderMutation.mutateAsync({
          orderData,
          idempotencyKey,
        });

        const createdOrderId = orderResponse?.id || orderResponse?.orderId;

        // Cleanup purchased items from cart (leaving unselected cart items intact)
        if (!directBuyItem) {
          await removePurchasedItems(checkoutItems.map((i) => i.id));
        }

        // If direct UPI manual payment -> Route straight to QR Code and UTR submission page
        if (mappedPaymentMethod === "MANUAL") {
          setIsProcessing(false);
          navigate(`/payment?orderId=${createdOrderId}`);
          return;
        }

        // If Razorpay gateway
        if (mappedPaymentMethod === "RAZORPAY") {
          try {
            const razorpayData = await createRazorpayOrderMutation.mutateAsync(createdOrderId);
            if (window.Razorpay && razorpayData) {
              const rzp = new window.Razorpay({
                key: razorpayData.keyId || "rzp_test_dummy",
                amount: razorpayData.amount,
                currency: "INR",
                name: "Shreekamalinee",
                description: `Order #${createdOrderId}`,
                order_id: razorpayData.razorpayOrderId,
                handler: async function (response) {
                  try {
                    await verifyRazorpayPaymentMutation.mutateAsync({
                      orderId: createdOrderId,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpayOrderId: response.razorpay_order_id,
                      razorpaySignature: response.razorpay_signature,
                    });
                    navigate(`/checkout/success?orderId=${createdOrderId}`);
                  } catch {
                    showToast("Payment verification failed", "warning");
                  }
                },
                prefill: {
                  name: user?.name,
                  email: user?.email,
                },
                theme: { color: "#800020" },
              });
              rzp.open();
              setIsProcessing(false);
              return;
            }
          } catch {
            // Razorpay stub fallback
          }
        }

        // COD or Fallback
        setIsProcessing(false);
        navigate(`/checkout/success?orderId=${createdOrderId}`);
        return;
      } else {
        setIsProcessing(false);
        showToast("Please sign in to complete checkout and secure your order.", "warning");
        navigate("/login", { state: { from: "/checkout" } });
      }
    } catch (err) {
      setIsProcessing(false);
      showToast(err.response?.data?.message || "Order placement failed. Please try again.", "warning");
    }
  };



  if (checkoutItems.length === 0) {
    return (
      <div className="bg-cream min-h-screen py-16 text-center">
        <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6">
          <ShoppingBag size={48} className="mx-auto text-charcoal/30 mb-4 stroke-[1.2]" />
          <h2 className="font-serif text-2xl font-bold mb-2">No Items to Checkout</h2>
          <p className="text-xs text-charcoal/60 mb-6">
            Please add handcrafted pieces to your bag before proceeding to checkout.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="md">
              Explore Collections
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (

    <div className="bg-cream min-h-screen py-4 sm:py-8 md:py-14">
      <div className="max-w-[1280px] 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-3 sm:px-6 md:px-10 2xl:px-12">
        <div className="mb-2">
          {directBuyItem ? (
            <Breadcrumb
              items={[
                { label: directBuyItem.name || "Handloom Saree", to: directBuyItem.productId ? `/details/${directBuyItem.productId}` : "/shop" },
                { label: "Direct Checkout" },
              ]}
            />
          ) : (
            <Breadcrumb items={[{ label: "Shopping Bag", to: "/cart" }, { label: "Secure Checkout" }]} />
          )}
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={() => {
            if (location.state?.from) {
              navigate(location.state.from);
            } else if (directBuyItem?.productId) {
              navigate(`/details/${directBuyItem.productId}`);
            } else if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/shop");
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-rust font-semibold transition-colors cursor-pointer mb-3"
        >
          <ArrowLeft size={14} />
          <span>Back to Shopping</span>
        </button>

        {/* Header Title */}
        <div className="pb-4 mb-4 sm:mb-8 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-rust">
              {directBuyItem ? "Express Order" : "Step 2 of 2"}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal">
              {directBuyItem ? "Express Direct Checkout" : "Checkout & Payment"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Lock size={13} />
            <span>100% Secure Checkout</span>
          </div>
        </div>


        <div className="grid lg:grid-cols-[1.6fr_1fr] 2xl:grid-cols-[1.8fr_1fr] gap-5 lg:gap-10 2xl:gap-16 items-start">

          {/* Left Column: Delivery Address & Payment Method Selector */}
          <div className="space-y-6 sm:space-y-8 min-w-0 w-full">
            {/* 1. Shipping Address Selection */}
            <div className="bg-white border border-line rounded-sm p-4 sm:p-6 md:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-line gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rust text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-serif font-bold text-base sm:text-lg md:text-xl text-charcoal">
                    Shipping & Delivery Address
                  </h3>
                </div>

                <button
                  onClick={() => setNewAddressModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rust hover:text-rust-deep uppercase tracking-wider cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                {addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    selectable={true}
                    selected={selectedAddressId === addr.id}
                    onSelect={() => setSelectedAddressId(addr.id)}
                  />
                ))}
              </div>
            </div>

            {/* 2. Payment Method Selector */}
            <div className="bg-white border border-line rounded-sm p-4 sm:p-6 md:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-line">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rust text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg md:text-xl text-charcoal">
                  Select Payment Option
                </h3>
              </div>

              <div className="space-y-3">
                {/* Razorpay Online */}
                {isRazorpayPaymentActive && (
                  <label
                    className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === "RAZORPAY"
                        ? "border-rust bg-rust/5 ring-1 ring-rust"
                        : "border-line bg-white hover:border-rust/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="RAZORPAY"
                      checked={paymentMethod === "RAZORPAY"}
                      onChange={() => setPaymentMethod("RAZORPAY")}
                      className="accent-rust mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <strong className="text-xs sm:text-sm text-charcoal flex items-center gap-1.5 sm:gap-2">
                          <CreditCard size={15} className="text-rust shrink-0" />
                          <span>Razorpay Secure Online Checkout</span>
                        </strong>
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-xs shrink-0">
                          Instant
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-charcoal/60 mt-1 leading-relaxed">
                        Pay safely via UPI (GooglePay, PhonePe, Paytm), Credit / Debit Cards, NetBanking.
                      </p>
                    </div>
                  </label>
                )}

                {/* Direct UPI / QR */}
                {isUpiPaymentActive && (
                  <label
                    className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === "UPI_DIRECT"
                        ? "border-rust bg-rust/5 ring-1 ring-rust"
                        : "border-line bg-white hover:border-rust/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="UPI_DIRECT"
                      checked={paymentMethod === "UPI_DIRECT"}
                      onChange={() => setPaymentMethod("UPI_DIRECT")}
                      className="accent-rust mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-charcoal flex items-center gap-1.5">
                          <QrCode size={15} className="text-rust shrink-0" />
                          <span>Direct QR Code / UPI UTR Confirmation</span>
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200 shrink-0">
                          Zero Gateway Surcharge
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-charcoal/60 mt-1 leading-relaxed">
                        Scan Shreekamalinee’s official bank QR code and upload 12-digit UTR reference.
                      </p>
                    </div>
                  </label>
                )}

                {/* COD Option */}
                {isCodPaymentActive && (
                  <label
                    className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === "COD"
                        ? "border-rust bg-rust/5 ring-1 ring-rust"
                        : "border-line bg-white hover:border-rust/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="accent-rust mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-charcoal flex items-center gap-1.5">
                          <Truck size={15} className="text-rust shrink-0" />
                          <span>Cash on Delivery (COD)</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                          isCodFree
                            ? "text-emerald-800 bg-emerald-50 border-emerald-300 font-bold"
                            : "text-charcoal/60 bg-cream-2 border-line"
                        }`}>
                          {isCodFree ? "FREE COD" : `+${formatCurrency(codHandlingFee)} Handling`}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-charcoal/60 mt-1 leading-relaxed">
                        {isCodFree
                          ? `Pay cash at doorstep upon verified courier delivery (FREE COD unlocked on orders above ${formatCurrency(freeCodThreshold)}).`
                          : `Pay cash at doorstep upon delivery (+${formatCurrency(codHandlingFee)} handling fee applied. FREE on orders above ${formatCurrency(freeCodThreshold)}).`}
                      </p>
                    </div>
                  </label>
                )}

                {/* WhatsApp Order Booking Option */}
                {isWhatsappOrderActive && (
                  <label
                    className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === "WHATSAPP"
                        ? "border-[#25D366] bg-[#25D366]/5 ring-1 ring-[#25D366]"
                        : "border-line bg-white hover:border-[#25D366]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="WHATSAPP"
                      checked={paymentMethod === "WHATSAPP"}
                      onChange={() => setPaymentMethod("WHATSAPP")}
                      className="accent-[#25D366] mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-charcoal flex items-center gap-1.5">
                          <span className="text-[#25D366] text-base leading-none">💬</span>
                          <span>WhatsApp Assisted Booking & Payment</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#20ba5a] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Personal Concierge
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-charcoal/60 mt-1 leading-relaxed">
                        Connect directly with our atelier on WhatsApp to confirm handloom details, customization, and pay securely.
                      </p>
                    </div>
                  </label>
                )}

                {!isRazorpayPaymentActive && !isUpiPaymentActive && !isCodPaymentActive && !isWhatsappOrderActive && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xs">
                    Please contact support. Online checkouts are undergoing maintenance.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Action */}
          <div className="bg-white border border-line rounded-sm p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-xs lg:sticky lg:top-24 w-full min-w-0">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-charcoal pb-3 border-b border-line">
              Order Summary
            </h3>

            {/* Dynamic SLA Estimated Delivery Banner */}
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xs flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                <Truck size={15} className="text-[#800020] shrink-0" />
                <span>
                  Estimated Delivery: <strong>{estimatedDeliveryRange}</strong> ({minDeliveryDays}–{maxDeliveryDays} business days)
                </span>
              </div>

              {storeSettings?.deliveryPolicyNotice && (
                <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xs text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                  <AlertTriangle size={14} className="text-amber-800 shrink-0 mt-0.5" />
                  <span>{storeSettings.deliveryPolicyNotice}</span>
                </div>
              )}
            </div>

            {/* Bag Item Thumbnails */}
            <div className="divide-y divide-line/60 max-h-60 overflow-y-auto pr-1">
              {checkoutItems.map((item) => (
                <div key={item.id || item.variantId} className="py-3 first:pt-0 last:pb-0 flex gap-3 items-center">
                  <img
                    src={item.image || (Array.isArray(item.imageUrls) && item.imageUrls[0]) || "/images/placeholder-saree.jpg"}
                    alt={item.name || item.title || "Handloom"}
                    className="w-12 h-16 object-cover rounded-xs border border-line"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <h4 className="font-bold text-charcoal truncate">{item.name || item.title || "Product"}</h4>
                    <p className="text-charcoal/60 text-[11px]">
                      Qty: {item.qty || item.quantity || 1} × {formatCurrency(item.price || 0)}
                      {item.selectedSize && item.selectedSize !== "Standard" ? ` • ${item.selectedSize}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-charcoal">
                    {formatCurrency((item.price || 0) * (item.qty || item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Promo Code Box */}
            <div className="space-y-2 pt-3 border-t border-line/60">
              <label className="text-[11px] uppercase font-bold tracking-wider text-charcoal flex items-center gap-1.5">
                <Tag size={13} className="text-rust" />
                <span>Apply Promo Code</span>
              </label>

              {appliedCoupon ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-emerald-800 tracking-wider">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[10px] text-emerald-700">{appliedCoupon.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCouponCode}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (checkoutCouponInput.trim()) {
                      applyCouponCode(checkoutCouponInput.trim(), checkoutSubtotal);
                      setCheckoutCouponInput("");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={checkoutCouponInput}
                    onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE10"
                    className="flex-1 px-3 py-1.5 text-xs border border-line uppercase font-bold tracking-wider rounded-xs bg-cream-2/30 outline-none focus:border-rust"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-charcoal/90 cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Available Coupons List from Backend */}
              {validCoupons && validCoupons.length > 0 && !appliedCoupon && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-charcoal/60">
                    Available Offers:
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {validCoupons.map((c) => {
                      const minSpendVal = Number(c.minOrderAmount || c.minPurchaseAmount || 0);
                      const maxCapVal = Number(c.maxDiscountAmount || 0);
                      const isExpired = Boolean(c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date()) || c.active === false);
                      const isUsed = Boolean(c.isUsedByUser);
                      const isInactive = isExpired || isUsed;
                      const isBelowMinSpend = !isInactive && minSpendVal > 0 && checkoutSubtotal < minSpendVal;

                      return (
                        <div
                          key={c.id || c.code}
                          className={`p-2 border border-dashed rounded-xs flex items-center justify-between gap-2 text-xs transition-colors ${
                            isInactive
                              ? "bg-gray-100/80 border-gray-300 opacity-60"
                              : isBelowMinSpend
                              ? "bg-amber-50/50 border-amber-300/80"
                              : "bg-cream-2/40 border-[#D6A23F]/60"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-[10.5px] text-rust bg-rust/5 px-1 py-0.5 rounded-xs border border-rust/20">
                                {c.code}
                              </span>
                              {isUsed ? (
                                <span className="text-[9px] font-bold uppercase bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-xs">
                                  Already Used
                                </span>
                              ) : isExpired ? (
                                <span className="text-[9px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-xs">
                                  Expired
                                </span>
                              ) : null}
                              <span className="text-[10.5px] font-semibold text-charcoal truncate">
                                {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-charcoal/70 mt-0.5 space-y-0.5">
                              {minSpendVal > 0 && (
                                <p className={isBelowMinSpend ? "text-amber-800 font-semibold" : ""}>
                                  Min spend: ₹{minSpendVal}
                                  {isBelowMinSpend && (
                                    <span className="ml-1 text-amber-700">
                                      (add ₹{minSpendVal - checkoutSubtotal} more)
                                    </span>
                                  )}
                                </p>
                              )}
                              {maxCapVal > 0 && (
                                <p className="text-charcoal/50">Max cap: ₹{maxCapVal}</p>
                              )}
                            </div>
                          </div>
                          {isUsed ? (
                            <span className="px-2 py-0.5 text-[9.5px] font-bold text-gray-500 bg-gray-200 rounded-xs shrink-0 cursor-not-allowed">
                              Used
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 text-[9.5px] font-bold text-rose-500 bg-rose-50 rounded-xs shrink-0 cursor-not-allowed">
                              Expired
                            </span>
                          ) : isBelowMinSpend ? (
                            <button
                              type="button"
                              onClick={() => showToast(`Please add ₹${minSpendVal - checkoutSubtotal} more to unlock this coupon.`, "warning")}
                              className="px-2 py-0.5 text-[9.5px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 rounded-xs hover:bg-amber-200 transition-colors cursor-pointer shrink-0"
                              title={`Min spend ₹${minSpendVal} required`}
                            >
                              Min ₹{minSpendVal}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => applyCouponCode(c.code, checkoutSubtotal)}
                              className="px-2 py-0.5 text-[10px] font-bold text-rust hover:text-white hover:bg-rust border border-rust rounded-xs transition-colors cursor-pointer shrink-0"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs pt-4 border-t border-line">
              <div className="flex justify-between text-charcoal/70">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">{formatCurrency(checkoutSubtotal)}</span>
              </div>

              {checkoutDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Discount</span>
                  <span>-{formatCurrency(checkoutDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-charcoal/70">
                <span>Insured Express Shipping</span>
                <span className={checkoutShipping === 0 ? "text-emerald-700 font-semibold" : ""}>
                  {checkoutShipping === 0 ? "FREE" : formatCurrency(checkoutShipping)}
                </span>
              </div>

              {paymentMethod === "COD" && (
                <div className="flex justify-between text-charcoal/80">
                  <span>COD Cash Handling Fee</span>
                  <span className={effectiveCodFee === 0 ? "text-emerald-700 font-semibold" : "font-semibold text-charcoal"}>
                    {effectiveCodFee === 0 ? "FREE" : `+${formatCurrency(effectiveCodFee)}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-charcoal/70">
                <span>GST / Taxes</span>
                <span className="font-semibold text-charcoal">Included</span>
              </div>

              <div className="flex justify-between items-baseline pt-4 border-t border-line text-charcoal">
                <span className="font-serif font-bold text-base">Grand Total</span>
                <span className="font-serif font-bold text-2xl text-rust">
                  {formatCurrency(checkoutGrandTotal)}
                </span>
              </div>
            </div>

            {/* Action Place Order */}
            {paymentMethod === "WHATSAPP" ? (
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs tracking-wider uppercase font-bold rounded-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="text-base leading-none">💬</span>
                <span>Confirm Order via WhatsApp ({formatCurrency(checkoutGrandTotal)})</span>
              </button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isProcessing}
                onClick={() => {
                  if (paymentMethod === "COD") {
                    if (!selectedAddress) {
                      showToast("Please select or add a delivery address.", "warning");
                      return;
                    }
                    if (checkoutItems.length === 0) {
                      showToast("Your checkout bag is empty.", "warning");
                      return;
                    }
                    setIsCodModalOpen(true);
                    return;
                  }
                  handlePlaceOrder();
                }}
                icon={CheckCircle2}
              >
                {paymentMethod === "UPI_DIRECT"
                  ? `Proceed to UPI / QR Verification (${formatCurrency(checkoutGrandTotal)})`
                  : `Authorize Payment of ${formatCurrency(checkoutGrandTotal)}`}
              </Button>
            )}


            <div className="pt-3 border-t border-line/60 flex items-center justify-center gap-2 text-[11px] text-charcoal/50">
              <ShieldCheck size={15} className="text-rust shrink-0" />
              <span>100% Genuine Handloom Authenticity Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={newAddressModalOpen}
        onClose={() => setNewAddressModalOpen(false)}
        title="Add New Shipping Address"
        subtitle="Ensure pin code and phone number are accurate"
      >
        <form onSubmit={handleAddNewAddress} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                Recipient Full Name *
              </label>
              <input
                type="text"
                required
                value={newAddressForm.name}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                Mobile Number *
              </label>
              <PhoneInput
                defaultCountry="in"
                value={newAddressForm.phone}
                onChange={(phone) => setNewAddressForm({ ...newAddressForm, phone })}
                className="w-full text-xs"
                inputClassName="!w-full !py-2.5 !px-3.5 !text-xs !bg-white !border-line !rounded-r-xs !font-medium !text-charcoal focus:!border-rust"
                countrySelectorStyleProps={{
                  buttonClassName: "!bg-gray-50 !border-line !rounded-l-xs !px-2.5",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Flat, House No., Building, Apartment *
            </label>
            <input
              type="text"
              required
              value={newAddressForm.addressLine1}
              onChange={(e) =>
                setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })
              }
              placeholder="e.g. Flat 402, Royal Palms Residency, 4th Floor"
              className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Street, Area, Landmark (Optional)
            </label>
            <input
              type="text"
              value={newAddressForm.addressLine2}
              onChange={(e) =>
                setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })
              }
              placeholder="e.g. Near Inorbit Mall, MG Road, Shivaji Nagar"
              className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={newAddressForm.city}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                State *
              </label>
              <select
                required
                value={newAddressForm.state}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={newAddressForm.pincode}
                onChange={(e) =>
                  setNewAddressForm({
                    ...newAddressForm,
                    pincode: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="400001"
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
            Save & Deliver to This Address
          </Button>
        </form>
      </Modal>

      {/* Dedicated Cash on Delivery (COD) Confirmation Step */}
      <Modal
        isOpen={isCodModalOpen}
        onClose={() => {
          setIsCodModalOpen(false);
          setIsCodAgreed(false);
        }}
        title="Confirm Cash on Delivery Order"
        subtitle="Please review items, delivery address, and exact cash amount"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs flex items-start gap-2.5 text-amber-900">
            <AlertTriangle size={16} className="text-amber-800 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Important Cash on Delivery Notice:</strong>
              <span className="text-[11.5px] leading-relaxed">
                Please ensure you or an authorized family member is available at the delivery address with exact cash to avoid courier dispatch returns.
              </span>
            </div>
          </div>

          {/* Item Recap */}
          <div className="border border-gray-200 rounded-xs p-3 space-y-2 bg-gray-50/70 max-h-40 overflow-y-auto">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block">
              Shipment Items ({checkoutItems.length}):
            </span>
            {checkoutItems.map((item) => (
              <div key={item.id || item.variantId} className="flex justify-between items-center text-xs">
                <span className="truncate max-w-[240px] text-gray-800 font-medium">
                  {item.qty || 1}x {item.name || item.title} {item.selectedSize && item.selectedSize !== "Standard" ? `(${item.selectedSize})` : ""}
                </span>
                <span className="font-mono font-bold text-gray-900">
                  {formatCurrency((item.price || 0) * (item.qty || 1))}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery Destination */}
          <div className="border border-gray-200 rounded-xs p-3 bg-white space-y-1">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block">
              Delivery Address:
            </span>
            <p className="font-bold text-gray-900">{selectedAddress?.fullName || selectedAddress?.name}</p>
            <p className="text-gray-600 text-[11px]">
              {selectedAddress?.streetAddress || selectedAddress?.addressLine1}
              {selectedAddress?.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""},{" "}
              {selectedAddress?.city}, {selectedAddress?.state} -{" "}
              {selectedAddress?.pinCode || selectedAddress?.postalCode || selectedAddress?.pincode}
            </p>
            <p className="text-gray-600 text-[11px]">
              Contact Phone: <strong>+91 {selectedAddress?.phone || selectedAddress?.phoneNumber}</strong>
            </p>
          </div>

          {/* Cash Payable Amount */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">
                Total Cash Payable at Doorstep:
              </span>
              <span className="text-[10px] text-emerald-700">
                Inclusive of GST, Express Delivery & COD handling (+{formatCurrency(codHandlingFee)})
              </span>
            </div>
            <span className="font-serif font-bold text-xl text-emerald-950">
              {formatCurrency(checkoutGrandTotal)}
            </span>
          </div>

          {/* Mandatory Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 border border-gray-300 rounded-xs bg-white hover:bg-gray-50/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCodAgreed}
              onChange={(e) => setIsCodAgreed(e.target.checked)}
              className="accent-[#800020] mt-0.5 w-4 h-4 rounded-xs cursor-pointer"
            />
            <span className="text-xs text-gray-800 font-medium leading-relaxed">
              I confirm that my contact and delivery address are accurate, and I commit to paying <strong>{formatCurrency(checkoutGrandTotal)}</strong> in cash upon courier delivery.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCodModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!isCodAgreed || isProcessing}
              isLoading={isProcessing}
              onClick={async () => {
                setIsCodModalOpen(false);
                await handlePlaceOrder();
              }}
            >
              Confirm & Place COD Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
