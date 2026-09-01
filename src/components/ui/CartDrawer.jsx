import { useCart } from "../../context/CartContext.jsx";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import { formatCurrency } from "../../utils/formatters.js";
import { MessageCircle, ShoppingBag, Trash2, X, Plus, Minus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CartDrawer({ onCheckout }) {
  const {
    cart,
    selectedItemIds,
    selectedCartItems,
    toggleSelectItem,
    toggleSelectAll,
    isAllSelected,
    changeQty,
    removeItem,
    drawerOpen,
    setDrawerOpen,
    subtotal,
    isFreeShipping,
    freeShippingThreshold,
    standardShippingFee,
  } = useCart();
  const { data: storeSettings } = useBankDetailsQuery();
  const freeShipAt = freeShippingThreshold;

  const handleWhatsAppInquiry = () => {
    const itemsToInquire = selectedCartItems.length > 0 ? selectedCartItems : cart;
    const itemsText = itemsToInquire
      .map((item) => {
        const itemPrice = Number(item.price ?? item.offerPrice ?? 0);
        return `- *${item.name}* (Qty: ${item.qty}${
          item.selectedSize ? `, Size: ${item.selectedSize}` : ""
        }) — ${formatCurrency(itemPrice * item.qty)}`;
      })
      .join("\n");

    const message = `🌸 *Shreekamalinee Studio — Cart Inquiry* 🌸
-----------------------------------------
Hello! I would like to inquire about these items in my shopping bag:

${itemsText}
-----------------------------------------
💰 *Subtotal:* ${formatCurrency(subtotal)}

Could you please confirm fabric availability and delivery timeline?`;

    const rawPhone = storeSettings?.whatsappNumber || storeSettings?.contactPhone || "919820785210";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[440px] max-w-[92vw] bg-[#FAF7F2] z-[101] shadow-2xl flex flex-col transition-transform duration-[400ms] ease-out border-l border-[#E6DFD3] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#E6DFD3] bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-rust" />
            <h3 className="font-serif text-xl font-bold text-charcoal">
              Shopping Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})
            </h3>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-charcoal/60 hover:text-charcoal hover:bg-[#FAF7F2] rounded-full transition-colors cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Notification Strip */}
        <div className="bg-[#F4EEE3] px-6 py-2 border-b border-[#E6DFD3] text-[11px] font-semibold text-charcoal/80 flex items-center justify-between">
          <span>
            {isFreeShipping
              ? "🎉 You have unlocked Free Shipping!"
              : `Add ${formatCurrency(Math.max(0, freeShipAt - subtotal))} more for Free Shipping`}
          </span>
          <span className="text-rust font-bold">
            {isFreeShipping ? "FREE" : formatCurrency(standardShippingFee)}
          </span>
        </div>

        {/* Select All Bar */}
        {cart.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-cream-2/50 border-b border-[#E6DFD3] text-xs font-semibold text-charcoal">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded-xs text-rust focus:ring-rust border-line accent-rust cursor-pointer"
              />
              <span>
                Select All ({selectedCartItems.length}/{cart.length})
              </span>
            </label>
            {selectedCartItems.length > 0 && (
              <span className="text-[11px] text-rust font-bold">
                {selectedCartItems.length} {selectedCartItems.length === 1 ? "item" : "items"} chosen
              </span>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#E6DFD3]/60">
          {cart.length === 0 ? (
            <div className="text-center py-20 px-4 text-charcoal/60 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#F4EEE3] flex items-center justify-center text-rust mb-4 shadow-inner">
                <ShoppingBag size={28} className="stroke-[1.5]" />
              </div>
              <h4 className="font-serif text-lg font-bold text-charcoal mb-1">
                Your bag is feeling light
              </h4>
              <p className="text-xs text-charcoal/60 max-w-xs mb-6">
                Discover our royal handcrafted sarees and heritage fabrics to begin.
              </p>
              <Link
                to="/shop"
                onClick={() => setDrawerOpen(false)}
                className="py-2.5 px-6 bg-rust text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-rust-deep transition-all shadow-xs"
              >
                Explore Collections
              </Link>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice = Number(item.price ?? item.offerPrice ?? item.sellingPrice ?? item.originalPrice ?? 0);
              const lineTotal = unitPrice * (Number(item.qty) || 1);
              const isSelected = selectedItemIds.has(item.id);

              return (
                <div
                  key={`${item.id}-${item.selectedSize}`}
                  className={`flex items-start gap-3 py-4 group transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-60 bg-cream-2/20"
                  }`}
                >
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(item.id)}
                    className="w-4 h-4 mt-2.5 rounded-xs text-rust focus:ring-rust border-line accent-rust cursor-pointer shrink-0"
                    aria-label={`Select ${item.name}`}
                  />

                  {/* Product Thumbnail */}
                  <Link
                    to={`/product/${item.productId || item.id}`}
                    onClick={() => setDrawerOpen(false)}
                    className="w-16 h-20 flex-shrink-0 bg-[#F4EEE3] overflow-hidden rounded-xs border border-[#E6DFD3]/70 relative"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.productId || item.id}`}
                          onClick={() => setDrawerOpen(false)}
                          className="text-xs sm:text-sm font-semibold text-charcoal hover:text-rust transition-colors line-clamp-1 leading-snug"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id, item.selectedSize)}
                          className="text-charcoal/40 hover:text-rose-600 p-1 cursor-pointer transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="text-[11px] text-charcoal/50 mt-0.5">
                        {item.selectedSize ? `Size: ${item.selectedSize}` : "Free Size"}
                        {item.selectedColor && item.selectedColor !== "Default" && ` · ${item.selectedColor}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-transparent">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#E6DFD3] rounded-xs bg-white">
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, -1, item.selectedSize)}
                          className="w-6 h-6 flex items-center justify-center text-charcoal/70 hover:text-rust cursor-pointer text-xs"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-charcoal">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, 1, item.selectedSize)}
                          className="w-6 h-6 flex items-center justify-center text-charcoal/70 hover:text-rust cursor-pointer text-xs"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Line & Unit Price Display */}
                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-charcoal block">
                          {formatCurrency(lineTotal)}
                        </span>
                        {item.qty > 1 && (
                          <span className="text-[10px] text-charcoal/50 block">
                            {formatCurrency(unitPrice)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Actions */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E6DFD3] bg-white space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <div>
                <span className="text-charcoal/70 font-medium">Selected Subtotal</span>
                <span className="text-[11px] text-charcoal/50 block">
                  ({selectedCartItems.length} of {cart.length} items)
                </span>
              </div>
              <b className="font-serif text-2xl font-bold text-charcoal">
                {formatCurrency(subtotal)}
              </b>
            </div>

            <button
              onClick={() => {
                setDrawerOpen(false);
                onCheckout();
              }}
              disabled={selectedCartItems.length === 0}
              className={`w-full py-3.5 text-white text-xs tracking-wider uppercase transition-all font-bold rounded-full flex items-center justify-center gap-2 shadow-sm ${
                selectedCartItems.length === 0
                  ? "bg-charcoal/40 cursor-not-allowed"
                  : "bg-rust hover:bg-rust-deep cursor-pointer active:scale-[0.98]"
              }`}
            >
              <span>
                {selectedCartItems.length === 0
                  ? "Select items to checkout"
                  : `Proceed to Checkout (${selectedCartItems.length} ${
                      selectedCartItems.length === 1 ? "item" : "items"
                    })`}
              </span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="w-full py-2.5 bg-[#25D366]/10 border border-[#25D366]/40 hover:bg-[#25D366]/20 text-[#128C7E] text-xs uppercase font-bold tracking-wider rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle size={15} />
              <span>Inquire on WhatsApp</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

