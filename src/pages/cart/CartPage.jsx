import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Plus,
  Minus,
  Truck,
  MessageCircle,
} from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAvailableCouponsQuery } from "../../queries/useCouponQueries.js";
import { formatCurrency } from "../../utils/formatters.js";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function CartPage() {
  const navigate = useNavigate();
  const { data: availableCoupons = [] } = useAvailableCouponsQuery();
  const {
    cart,
    selectedItemIds,
    selectedCartItems,
    isAllSelected,
    toggleSelectItem,
    toggleSelectAll,
    changeQty,
    removeItem,
    clearCart,
    subtotal,
    appliedCoupon,
    discountAmount,
    freeShippingThreshold = 1499,
    shippingFee,
    isFreeShipping,
    grandTotal,
    applyCouponCode,
    removeCouponCode,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");

  useSEO({
    title: "Your Shopping Bag — Shreekamalinee",
    description: "Review your handpicked royal sarees and fabrics before checkout.",
  });

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

  const targetThreshold = Number(freeShippingThreshold) || 1499;
  const progressPercent = Math.min(100, Math.round((subtotal / targetThreshold) * 100));
  const remainingForFreeShip = Math.max(0, targetThreshold - subtotal);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCouponCode(couponInput.trim());
      setCouponInput("");
    }
  };

  const handleWhatsAppInquiry = () => {
    const itemsToInquire = selectedCartItems.length > 0 ? selectedCartItems : cart;
    const itemsText = itemsToInquire
      .map(
        (item) =>
          `- *${item.name}* (Qty: ${item.qty}${
            item.selectedSize ? `, Size: ${item.selectedSize}` : ""
          }) — ₹${(item.price * item.qty).toLocaleString("en-IN")}`
      )
      .join("\n");

    const message = `🌸 *Shreekamalinee Studio — Cart Inquiry* 🌸
-----------------------------------------
Hello! I would like to inquire about the following items in my shopping bag:

${itemsText}
-----------------------------------------
💰 *Subtotal:* ₹${subtotal.toLocaleString("en-IN")}${
      discountAmount > 0
        ? `\n🎟️ *Applied Promo (${appliedCoupon?.code}):* -₹${discountAmount.toLocaleString("en-IN")}`
        : ""
    }
🚚 *Shipping:* ${shippingFee === 0 ? "FREE Shipping" : `₹${shippingFee.toLocaleString("en-IN")}`}
💵 *Estimated Total:* ₹${grandTotal.toLocaleString("en-IN")}

Could you please confirm the handloom fabric availability and delivery assistance?`;

    const whatsappUrl = `https://wa.me/9820785210?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (cart.length === 0) {
    return (
      <div className="bg-cream min-h-screen py-16">
        <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
          <Breadcrumb items={[{ label: "Shopping Bag" }]} />
          <EmptyState
            icon={ShoppingBag}
            title="Your Shopping Bag is Empty"
            description="You haven't added any handcrafted treasures to your bag yet. Explore our royal collections to find something exceptional."
            actionLabel="Discover Collections"
            actionTo="/shop"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-6 sm:py-8 md:py-14">
      <div className="max-w-[1280px] 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12">
        <Breadcrumb items={[{ label: "Shopping Bag" }]} />

        {/* Page Header */}
        <div className="flex items-end justify-between pb-4 mb-6 sm:mb-8 border-b border-line">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-rust">
              Review Bag
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal">
              Your Shopping Bag
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
          >
            Clear Entire Bag
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-white border border-line p-4 rounded-sm mb-6 sm:mb-8 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 text-charcoal">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-rust" />
              <span>
                {isFreeShipping
                  ? "🎉 You have unlocked Free Express Insured Shipping!"
                  : `Add ₹${remainingForFreeShip} more to get Free Express Shipping!`}
              </span>
            </div>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-cream-2 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rust h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1.6fr_1fr] 2xl:grid-cols-[1.8fr_1fr] gap-6 lg:gap-10 2xl:gap-16 items-start">

          {/* Left Column: Cart Items List */}
          <div className="space-y-4">
            {/* Select All Bar */}
            <div className="bg-white border border-line rounded-sm px-4 py-3 flex items-center justify-between shadow-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-rust accent-rust cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
                  Select All ({cart.length} items)
                </span>
              </label>
              <span className="text-[11.5px] text-charcoal/60 font-medium">
                {selectedCartItems.length} selected for checkout
              </span>
            </div>

            {cart.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              return (
                <div
                  key={`${item.id}-${item.selectedSize}`}
                  className={`bg-white border rounded-sm p-4 md:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    isSelected ? "border-line" : "border-line/40 opacity-75 bg-cream/20"
                  }`}
                >
                  {/* Item Selection & Thumbnail & Info */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded text-rust accent-rust cursor-pointer shrink-0"
                    />

                    <Link
                      to={`/product/${item.productId || item.id}`}
                      className="w-20 h-24 sm:w-24 sm:h-28 rounded-xs overflow-hidden border border-line shrink-0 bg-cream-2 block"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rust">
                        {item.subcat || item.cat || "Luxury Handloom"}
                      </span>
                      <Link
                        to={`/product/${item.productId || item.id}`}
                        className="font-serif font-bold text-sm sm:text-base text-charcoal hover:text-rust transition-colors block line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-[11.5px] text-charcoal/55">
                        {item.selectedSize ? `Dimension: ${item.selectedSize}` : "Standard"}
                      </p>
                      <span className="font-semibold text-xs sm:text-sm text-charcoal block sm:hidden">
                        {formatCurrency(item.price)} each
                      </span>
                    </div>
                  </div>

                  {/* Item Quantity & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-line/60">
                    <div className="flex items-center border border-line rounded-xs bg-cream-2/40">
                      <button
                        onClick={() => changeQty(item.id, -1, item.selectedSize)}
                        className="p-1.5 text-charcoal/70 hover:text-rust transition-colors cursor-pointer"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-charcoal">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQty(item.id, 1, item.selectedSize)}
                        className="p-1.5 text-charcoal/70 hover:text-rust transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-sm sm:text-base text-charcoal">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id, item.selectedSize)}
                        className="text-charcoal/40 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="bg-white border border-line rounded-sm p-6 md:p-8 shadow-xs space-y-6 sticky top-28">
            <h3 className="font-serif font-bold text-xl text-charcoal pb-3 border-b border-line">
              Order Summary
            </h3>

            {/* Coupon Code Box */}
            <div className="space-y-2.5">
              <label className="text-[11px] uppercase font-bold tracking-wider text-charcoal flex items-center gap-1.5">
                <Tag size={13} className="text-rust" />
                <span>Apply Promo Code</span>
              </label>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-emerald-800 tracking-wider">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[10.5px] text-emerald-700">{appliedCoupon.description}</p>
                  </div>
                  <button
                    onClick={removeCouponCode}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE10"
                    className="flex-1 px-3 py-2 text-xs border border-line uppercase font-bold tracking-wider rounded-xs bg-cream-2/30 outline-none focus:border-rust"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-charcoal/90 cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Available Coupons List from Backend */}
              {validCoupons && validCoupons.length > 0 && !appliedCoupon && (
                <div className="space-y-2 pt-2 border-t border-line/60">
                  <p className="text-[10.5px] uppercase font-bold tracking-wider text-charcoal/70">
                    Available Offers & Coupons:
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {validCoupons.map((c) => {
                      const discountDesc =
                        c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}% OFF`
                          : `₹${c.discountValue} FLAT OFF`;
                      const minSpendVal = Number(c.minOrderAmount || c.minPurchaseAmount || 0);
                      const maxCapVal = Number(c.maxDiscountAmount || 0);
                      const isExpired = Boolean(c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date()) || c.active === false);
                      const isUsed = Boolean(c.isUsedByUser);
                      const isInactive = isExpired || isUsed;
                      const isBelowMinSpend = !isInactive && minSpendVal > 0 && subtotal < minSpendVal;

                      return (
                        <div
                          key={c.id || c.code}
                          className={`p-2.5 border border-dashed rounded-xs flex items-center justify-between gap-2 text-xs transition-colors ${
                            isInactive
                              ? "bg-gray-100/80 border-gray-300 opacity-60"
                              : isBelowMinSpend
                              ? "bg-amber-50/50 border-amber-300/80"
                              : "bg-cream-2/40 border-[#D6A23F]/60"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-[11px] text-rust bg-rust/5 px-1.5 py-0.5 rounded-xs border border-rust/20">
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
                              <span className="text-[11px] font-semibold text-charcoal truncate">
                                {discountDesc}
                              </span>
                            </div>
                            <div className="text-[10px] text-charcoal/70 mt-0.5 space-y-0.5">
                              {minSpendVal > 0 && (
                                <p className={isBelowMinSpend ? "text-amber-800 font-semibold" : ""}>
                                  Min spend: ₹{minSpendVal}
                                  {isBelowMinSpend && (
                                    <span className="ml-1 text-amber-700">
                                      (add ₹{minSpendVal - subtotal} more to unlock)
                                    </span>
                                  )}
                                </p>
                              )}
                              {maxCapVal > 0 && (
                                <p className="text-charcoal/50">Max discount cap: ₹{maxCapVal}</p>
                              )}
                            </div>
                          </div>
                          {isUsed ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold text-gray-500 bg-gray-200 rounded-xs shrink-0 cursor-not-allowed">
                              Used
                            </span>
                          ) : isExpired ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold text-rose-500 bg-rose-50 rounded-xs shrink-0 cursor-not-allowed">
                              Expired
                            </span>
                          ) : isBelowMinSpend ? (
                            <button
                              type="button"
                              onClick={() => showToast(`Please add ₹${minSpendVal - subtotal} more worth of items to unlock this coupon.`, "warning")}
                              className="px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 rounded-xs hover:bg-amber-200 transition-colors cursor-pointer shrink-0"
                              title={`Min spend ₹${minSpendVal} required`}
                            >
                              Min ₹{minSpendVal}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => applyCouponCode(c.code, subtotal)}
                              className="px-2.5 py-1 text-[10.5px] font-bold text-rust hover:text-white hover:bg-rust border border-rust rounded-xs transition-colors cursor-pointer shrink-0"
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
            <div className="space-y-3 pt-3 border-t border-line text-xs">
              <div className="flex justify-between text-charcoal/70">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-charcoal/70">
                <span>Estimated Shipping</span>
                <span className={shippingFee === 0 ? "text-emerald-700 font-semibold" : ""}>
                  {shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between text-charcoal/70">
                <span>Taxes & Duties</span>
                <span className="font-semibold text-charcoal">Included (GST)</span>
              </div>

              <div className="flex justify-between items-baseline pt-4 border-t border-line text-charcoal">
                <span className="font-serif font-bold text-base">Grand Total</span>
                <span className="font-serif font-bold text-2xl text-rust">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Checkout & Inquiry Actions */}
            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={selectedCartItems.length === 0}
                onClick={() => navigate("/checkout")}
                icon={ArrowRight}
              >
                {selectedCartItems.length === 0
                  ? "Select items to checkout"
                  : `Proceed to Secure Checkout (${selectedCartItems.length} items)`}
              </Button>

              {/* Direct WhatsApp Cart Inquiry */}
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="w-full py-3 bg-[#25D366]/10 border border-[#25D366]/40 hover:bg-[#25D366]/20 text-[#128C7E] text-[12px] uppercase font-bold tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle size={17} />
                <span>Inquire on WhatsApp with Cart</span>
              </button>

              <Link
                to="/shop"
                className="block text-center text-xs text-charcoal/60 hover:text-rust font-semibold uppercase tracking-wider transition-colors pt-1"
              >
                ← Continue Browsing
              </Link>
            </div>

            {/* Security Guarantee */}
            <div className="pt-4 border-t border-line/60 flex items-center justify-center gap-2 text-[11px] text-charcoal/60">
              <ShieldCheck size={15} className="text-rust" />
              <span>100% Safe & Secure Checkout</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
