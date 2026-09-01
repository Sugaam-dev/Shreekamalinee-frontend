import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  UserCheck,
  Sparkles,
  User,
  Truck,
  ShoppingBag,
  Tag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";
import { useCreateAdminManualOrderMutation } from "../../queries/useOrderQueries.js";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCustomersQuery } from "../../queries/useCustomerQueries.js";
import couponApi from "../../api/couponApi.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";

export default function AdminCreateOrderPage() {
  const navigate = useNavigate();
  const { showToast } = useCart();

  const { data: catalogProducts = [] } = useProductsQuery();
  const { data: customerList = [] } = useCustomersQuery();
  const createManualOrderMutation = useCreateAdminManualOrderMutation();

  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    productId: "",
    variantId: "",
    quantity: 1,
    couponCode: "",
    paymentMethod: "WHATSAPP_UPI",
    paymentStatus: "PAID",
    notes: "Booked via WhatsApp Concierge",
    sendEmailNotification: true,
  });

  const [couponValidationState, setCouponValidationState] = useState({
    isValidating: false,
    appliedCode: "",
    discount: 0,
    message: "",
    error: "",
  });

  const matchingCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    const q = customerSearchQuery.toLowerCase().trim();
    return customerList
      .filter(
        (c) =>
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phoneNumber && c.phoneNumber.includes(q)) ||
          (`${c.firstName || ""} ${c.lastName || ""}`.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [customerList, customerSearchQuery]);

  const matchedCustomer = useMemo(() => {
    if (!form.customerEmail && !form.customerPhone) return null;
    return (
      customerList.find(
        (c) =>
          (form.customerEmail && c.email?.toLowerCase() === form.customerEmail.toLowerCase().trim()) ||
          (form.customerPhone && c.phoneNumber && c.phoneNumber.replace(/\D/g, "") === form.customerPhone.replace(/\D/g, ""))
      ) || null
    );
  }, [customerList, form.customerEmail, form.customerPhone]);

  const handleSelectCustomer = (c) => {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.name || "";
    const defaultAddr = c.addresses?.[0] || {};
    setForm((prev) => ({
      ...prev,
      customerName: fullName || prev.customerName,
      customerEmail: c.email || prev.customerEmail,
      customerPhone: c.phoneNumber || prev.customerPhone,
      addressLine1: defaultAddr.streetAddress || defaultAddr.addressLine1 || prev.addressLine1,
      addressLine2: defaultAddr.addressLine2 || prev.addressLine2,
      city: defaultAddr.city || prev.city,
      state: defaultAddr.state || prev.state,
      postalCode: defaultAddr.postalCode || defaultAddr.pincode || prev.postalCode,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchQuery("");
    showToast(`Linked patron account: ${fullName || c.email}`, "success");
  };

  const selectedProduct = useMemo(() => {
    return catalogProducts.find((p) => p.id === form.productId) || null;
  }, [catalogProducts, form.productId]);

  const selectedVariant = useMemo(() => {
    if (!selectedProduct || !selectedProduct.variants) return null;
    return selectedProduct.variants.find((v) => v.id === form.variantId) || null;
  }, [selectedProduct, form.variantId]);

  const unitPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    return Number(selectedProduct.offerPrice ?? selectedProduct.price ?? selectedProduct.originalPrice ?? 0);
  }, [selectedProduct]);

  const subtotal = useMemo(() => {
    return unitPrice * (Number(form.quantity) || 1);
  }, [unitPrice, form.quantity]);

  const netPayable = useMemo(() => {
    return Math.max(0, subtotal - (couponValidationState.discount || 0));
  }, [subtotal, couponValidationState.discount]);

  const handleValidateCoupon = async () => {
    if (!form.couponCode?.trim()) {
      setCouponValidationState({ isValidating: false, appliedCode: "", discount: 0, message: "", error: "Please enter a coupon code" });
      return;
    }
    setCouponValidationState((prev) => ({ ...prev, isValidating: true, error: "" }));
    try {
      const res = await couponApi.validateCoupon(form.couponCode.trim(), subtotal, form.customerEmail.trim());
      if (res.valid) {
        const disc = Number(res.calculatedDiscount || res.discountAmount || 0);
        setCouponValidationState({
          isValidating: false,
          appliedCode: form.couponCode.trim().toUpperCase(),
          discount: disc,
          message: `✓ Validated: Saved ${formatCurrency(disc)}`,
          error: "",
        });
        showToast(`Coupon applied! Savings: ${formatCurrency(disc)}`, "success");
      } else {
        setCouponValidationState({
          isValidating: false,
          appliedCode: "",
          discount: 0,
          message: "",
          error: res.message || "Invalid coupon code",
        });
        showToast(res.message || "Invalid coupon", "warning");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to validate coupon";
      setCouponValidationState({
        isValidating: false,
        appliedCode: "",
        discount: 0,
        message: "",
        error: errMsg,
      });
      showToast(errMsg, "warning");
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.addressLine1 || !form.city || !form.state || !form.postalCode || !form.productId) {
      showToast("Please fill all required customer delivery address and product fields.", "warning");
      return;
    }

    try {
      const payload = {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        productId: form.productId,
        variantId: form.variantId || undefined,
        quantity: Number(form.quantity) || 1,
        couponCode: couponValidationState.appliedCode || form.couponCode.trim() || undefined,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        notes: form.notes,
        sendEmailNotification: Boolean(form.sendEmailNotification),
      };

      const res = await createManualOrderMutation.mutateAsync(payload);
      showToast(`Order created successfully! Reference: ${res.orderNumber}`, "success");
      navigate("/admin/orders");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create order", "danger");
    }
  };

  return (
    <AdminLayout
      title="Book Concierge & Offline Order"
      subtitle="Create and record orders finalized via WhatsApp chat, telephone, or boutique atelier visits"
      actions={
        <Link to="/admin/orders">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Orders
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <Breadcrumb
          items={[
            { label: "Admin Portal", to: "/admin/dashboard" },
            { label: "Orders", to: "/admin/orders" },
            { label: "Book Offline Order" },
          ]}
        />

        <form onSubmit={handleCreateOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Customer Details, Address, Product (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Quick Customer Lookup Search */}
              <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-xs relative">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Search size={14} className="text-emerald-700" />
                    <span>Search Existing Customer</span>
                  </span>
                  {matchedCustomer ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      <UserCheck size={12} />
                      <span>Account Linked: {matchedCustomer.firstName} {matchedCustomer.lastName || ""}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                      <Sparkles size={11} />
                      <span>New patron profile will be created</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type name, email (e.g. pamir@gmail.com) or phone number to auto-fill..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xs bg-[#FAF7F2] focus:bg-white focus:border-emerald-600 outline-none font-medium"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  {/* Search Results Dropdown */}
                  {showCustomerDropdown && matchingCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xs shadow-xl z-30 divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {matchingCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-gray-900 block text-xs">
                              {c.firstName} {c.lastName || ""}
                            </span>
                            <span className="text-[11px] text-gray-500">{c.email}</span>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                            {c.phoneNumber || "No Phone"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Customer Contact Info */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm uppercase text-gray-900 tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <User size={16} className="text-[#800020]" />
                  <span>Patron Contact Details</span>
                </h3>

                <div className="grid sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="e.g. Radhika Sharma"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      required
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      placeholder="e.g. 9820785210"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      placeholder="e.g. radhika@gmail.com"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Delivery Address */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm uppercase text-gray-900 tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Truck size={16} className="text-[#800020]" />
                  <span>Shipping & Delivery Destination</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Street Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={form.addressLine1}
                      onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                      placeholder="House / Flat No., Society / Road Name"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City / Town *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        placeholder="e.g. 400001"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Product & Variant Selection */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm uppercase text-gray-900 tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <ShoppingBag size={16} className="text-[#800020]" />
                  <span>Select Handcrafted Saree / Apparel</span>
                </h3>

                <div className="grid sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Catalog *</label>
                    <select
                      required
                      value={form.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prod = catalogProducts.find((p) => p.id === pid);
                        setForm({
                          ...form,
                          productId: pid,
                          variantId: prod?.variants?.[0]?.id || "",
                        });
                        setCouponValidationState({ isValidating: false, appliedCode: "", discount: 0, message: "", error: "" });
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    >
                      <option value="">-- Choose Saree / Product from Catalog --</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.offerPrice || p.price || 0)} (Stock: {p.stock || p.totalStock || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedVariant?.stock || selectedProduct?.stock || 10}
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium font-mono"
                    />
                  </div>

                  {/* Selected Product Visual Card Preview */}
                  {selectedProduct && (
                    <div className="sm:col-span-3 bg-[#FAF7F2] p-3.5 border border-[#E6DFD3] rounded-xs flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        {selectedProduct.images?.[0]?.imageUrl || selectedProduct.imageUrl ? (
                          <img
                            src={selectedProduct.images?.[0]?.imageUrl || selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="w-14 h-16 object-cover rounded-xs border border-gray-300 shadow-2xs"
                          />
                        ) : (
                          <div className="w-14 h-16 bg-gray-200 rounded-xs flex items-center justify-center text-gray-400">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        <div>
                          <span className="font-serif font-bold text-sm text-gray-900 block">{selectedProduct.name}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                            <span className="font-bold text-emerald-800">{formatCurrency(unitPrice)} each</span>
                            <span>•</span>
                            <span className="text-gray-400">SKU: {selectedProduct.sku || "N/A"}</span>
                            <span>•</span>
                            <span className="text-gray-600 font-semibold">Available Stock: {selectedProduct.stock || selectedProduct.totalStock || 0}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-[#800020] font-mono bg-[#800020]/10 px-3 py-1.5 rounded-xs border border-[#800020]/30">
                        Subtotal: {formatCurrency(subtotal)}
                      </span>
                    </div>
                  )}

                  {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Select Size / Color Variant</label>
                      <select
                        value={form.variantId}
                        onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                      >
                        {selectedProduct.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            Size: {v.size} | Color: {v.color} | Available Stock: {v.stock}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Coupon, Payment, Summary & Submit (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Promotional Voucher Card */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-3">
                <h3 className="font-serif font-bold text-sm uppercase text-gray-900 tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Tag size={16} className="text-[#800020]" />
                  <span>Promotional Coupon Voucher</span>
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.couponCode}
                    onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE35"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleValidateCoupon}
                    disabled={couponValidationState.isValidating || !selectedProduct}
                    className="px-4 py-2 bg-[#800020] text-white text-xs font-bold rounded-xs hover:bg-[#600018] cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    {couponValidationState.isValidating ? "Checking..." : "Apply"}
                  </button>
                </div>

                {couponValidationState.message && (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-xs border border-emerald-200">
                    <CheckCircle2 size={14} />
                    <span>{couponValidationState.message}</span>
                  </p>
                )}
                {couponValidationState.error && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 p-2 rounded-xs border border-rose-200">
                    <AlertCircle size={14} />
                    <span>{couponValidationState.error}</span>
                  </p>
                )}
              </div>

              {/* Booking Channel & Payment Mode */}
              <div className="bg-white border border-gray-200 rounded-xs p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm uppercase text-gray-900 tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <CreditCard size={16} className="text-[#800020]" />
                  <span>Payment Method & Status</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Booking Channel & Payment Mode</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    >
                      <option value="WHATSAPP_UPI">WhatsApp Direct UPI / GPay / PhonePe</option>
                      <option value="DIRECT_BANK">NEFT / RTGS Direct Bank Transfer</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    >
                      <option value="PAID">PAID (Funds Received & Verified)</option>
                      <option value="PENDING">PENDING (Awaiting Payment / COD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Internal Order Notes</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. Customer approved on WhatsApp with payment screenshot"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Order Bill Summary Breakdown */}
              <div className="bg-[#FAF7F2] border border-[#E6DFD3] rounded-xs p-5 shadow-xs space-y-3">
                <h3 className="font-serif font-bold text-sm uppercase text-gray-900 tracking-wider flex items-center gap-2 border-b border-[#E6DFD3] pb-3">
                  <MessageCircle size={16} className="text-emerald-700" />
                  <span>Order Cost Summary</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-gray-900 font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  {couponValidationState.discount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-xs border border-emerald-200">
                      <span>Coupon Discount ({couponValidationState.appliedCode}):</span>
                      <span className="font-mono">-{formatCurrency(couponValidationState.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Insured Delivery & Courier Packaging:</span>
                    <span className="font-semibold text-emerald-800">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#800020] border-t border-[#E6DFD3] pt-3">
                    <span>Grand Total Payable:</span>
                    <span className="font-mono text-lg">{formatCurrency(netPayable)}</span>
                  </div>
                </div>

                {/* Email Notification Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-3 border-t border-[#E6DFD3]">
                  <input
                    type="checkbox"
                    checked={form.sendEmailNotification}
                    onChange={(e) => setForm({ ...form, sendEmailNotification: e.target.checked })}
                    className="rounded-xs text-[#800020] focus:ring-[#800020] mt-0.5"
                  />
                  <span className="text-xs text-gray-700 font-medium leading-tight">
                    Dispatch automated order confirmation email and official Tax Invoice to patron
                  </span>
                </label>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={createManualOrderMutation.isPending}
                  onClick={() => navigate("/admin/orders")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-2 font-bold shadow-md"
                  disabled={createManualOrderMutation.isPending || !selectedProduct}
                  isLoading={createManualOrderMutation.isPending}
                >
                  {createManualOrderMutation.isPending ? "Booking Order..." : "Confirm & Book Order"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
