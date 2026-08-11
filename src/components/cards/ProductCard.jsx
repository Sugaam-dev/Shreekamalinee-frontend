import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";

export default function ProductCard({ product }) {
  const { toggleWish, wishlist } = useCart();
  const isWished = wishlist.has(product.id);

  const discountText = product.mrp && product.tag === "Sale"
    ? `${Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF`
    : product.tag;

  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-2 mb-4 rounded-sm shadow-sm">
        {product.isSoldOut ? (
          <span className="absolute top-3 left-3 z-10 text-[9.5px] tracking-[0.15em] font-bold uppercase px-2.5 py-1 text-white bg-rust-deep shadow-xs rounded-xs">
            Sold Out
          </span>
        ) : product.tag && (
          <span
            className={`absolute top-3 left-3 z-10 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 text-cream rounded-xs ${
              product.tag === "Sale" ? "bg-rust" : "bg-charcoal"
            }`}
          >
            {discountText}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWish(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center opacity-0 -translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-110 cursor-pointer"
        >
          <Heart size={14} className={isWished ? "fill-rust text-rust stroke-[2.2]" : "text-charcoal stroke-[1.8]"} />
        </button>

        <Link to={`/details/${product.id}`} className="absolute inset-0 block">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07] ${
              product.isSoldOut ? "opacity-80 grayscale-[25%]" : ""
            }`}
          />

          <div className={`absolute left-2.5 right-2.5 bottom-2.5 z-10 text-cream text-center py-3 text-[11.5px] tracking-[0.12em] uppercase opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all ${
            product.isSoldOut ? "bg-charcoal/90 hover:bg-charcoal" : "bg-charcoal hover:bg-rust"
          }`}>
            {product.isSoldOut ? "View Details" : "View Details"}
          </div>
        </Link>
      </div>

      <div className="flex flex-col gap-0.5">
        <Link to={`/details/${product.id}`} className="hover:text-rust transition-colors block">
          <div className="text-[15px] font-semibold text-charcoal leading-tight flex items-center justify-between">
            <span>{product.name}</span>
          </div>
        </Link>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-charcoal">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-charcoal/35 line-through">
                ₹{product.mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {product.isSoldOut && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-rust-deep bg-rust/10 px-2 py-0.5 rounded-xs">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
