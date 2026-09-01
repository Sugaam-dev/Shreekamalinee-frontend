import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";

export default function ProductCard({ product }) {
  const { toggleWish, wishlist } = useCart();
  const isWished = wishlist.has(product.id);

  const primaryImage =
    product.image ||
    product.imageUrls?.[0] ||
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";

  const sellingPrice = product.offerPrice ?? product.price ?? product.originalPrice ?? 0;
  const originalMrp = product.originalPrice ?? product.mrp ?? sellingPrice;
  const hasDiscount = originalMrp > sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalMrp - sellingPrice) / originalMrp) * 100)
    : 0;

  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  const isSoldOut = product.isSoldOut || (product.variants?.length > 0 && totalStock === 0);

  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-2 mb-4 rounded-sm shadow-sm">
        {isSoldOut ? (
          <span className="absolute top-3 left-3 z-10 text-[9.5px] tracking-[0.15em] font-bold uppercase px-2.5 py-1 text-white bg-rose-700 shadow-xs rounded-xs">
            Sold Out
          </span>
        ) : discountPercent > 0 ? (
          <span className="absolute top-3 left-3 z-10 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 text-white bg-[#800020] rounded-xs shadow-xs">
            {discountPercent}% OFF
          </span>
        ) : product.tag && (
          <span className="absolute top-3 left-3 z-10 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 text-white bg-gray-900 rounded-xs">
            {product.tag}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWish(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center opacity-100 sm:opacity-0 sm:translate-y-[-6px] sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all hover:scale-110 cursor-pointer"
          aria-label="Save to wishlist"
        >
          <Heart size={15} className={isWished ? "fill-[#800020] text-[#800020] stroke-[2.2]" : "text-charcoal stroke-[1.8]"} />
        </button>

        <Link to={`/product/${product.id}`} className="absolute inset-0 block">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07] ${
              isSoldOut ? "opacity-80 grayscale-[25%]" : ""
            }`}
          />

          <div className={`hidden sm:block absolute left-2.5 right-2.5 bottom-2.5 z-10 text-white text-center py-2.5 2xl:py-3 text-[11.5px] tracking-[0.12em] uppercase font-bold opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-md rounded-xs ${
            isSoldOut ? "bg-charcoal/90 hover:bg-charcoal" : "bg-charcoal hover:bg-rust"
          }`}>
            View Details
          </div>
        </Link>
      </div>


      <div className="flex flex-col gap-0.5">
        <Link to={`/product/${product.id}`} className="hover:text-[#800020] transition-colors block">
          <div className="text-[14px] font-semibold text-gray-900 leading-tight line-clamp-1">
            {product.name}
          </div>
        </Link>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">
              ₹{Number(sellingPrice).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ₹{Number(originalMrp).toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {isSoldOut && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-xs border border-rose-200">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
