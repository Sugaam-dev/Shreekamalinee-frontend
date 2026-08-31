import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, X, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useWishlistQuery } from "../../queries/useWishlistQueries.js";
import { formatCurrency } from "../../utils/formatters.js";

function normalizeWishlistItem(p) {
  if (!p) return null;
  const rawActivePrice = p.offerPrice ?? p.price ?? p.originalPrice ?? 0;
  const activePrice = Number(rawActivePrice) || 0;
  const rawOrigPrice = p.originalPrice ?? p.price ?? activePrice;
  const origPrice = Number(rawOrigPrice) || 0;

  return {
    id: p.id,
    name: p.name || p.title || "Handcrafted Heritage Saree",
    cat: p.categoryName || p.category?.name || p.cat || "Handloom",
    subcat: p.subCategoryName || p.subCategory?.name || p.parentCategoryName || p.subcat || "",
    price: activePrice > 0 ? activePrice : (origPrice > 0 ? origPrice : 0),
    originalPrice: origPrice > activePrice ? origPrice : null,
    image:
      (Array.isArray(p.imageUrls) && p.imageUrls[0]) ||
      p.imageUrl ||
      (Array.isArray(p.images) && p.images[0]) ||
      p.image ||
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    inStock: p.inStock !== false,
  };
}

export default function WishlistDrawer() {
  const { wishlist, toggleWish, addToCart, wishlistOpen, setWishlistOpen, setDrawerOpen } = useCart();
  const { isAuthenticated } = useAuth();
  const { data: dbProducts = [] } = useProductsQuery();
  const { data: serverWishlist = [] } = useWishlistQuery(isAuthenticated);

  // Combine live database products
  const allProductsMap = useMemo(() => {
    const map = new Map();
    // 1. Dynamic DB catalog products
    if (Array.isArray(dbProducts)) {
      dbProducts.forEach((p) => {
        const norm = normalizeWishlistItem(p);
        if (norm) map.set(String(p.id), norm);
      });
    }
    // 2. Server wishlist products (authenticated user)
    if (Array.isArray(serverWishlist)) {
      serverWishlist.forEach((p) => {
        const norm = normalizeWishlistItem(p);
        if (norm) map.set(String(p.id), norm);
      });
    }
    return map;
  }, [dbProducts, serverWishlist]);


  // Resolve active wishlist items
  const wishlistItems = useMemo(() => {
    const items = [];
    const seenIds = new Set();

    // First add server wishlist products if present
    if (Array.isArray(serverWishlist) && serverWishlist.length > 0) {
      serverWishlist.forEach((p) => {
        const norm = normalizeWishlistItem(p);
        if (norm && !seenIds.has(String(norm.id))) {
          seenIds.add(String(norm.id));
          items.push(norm);
        }
      });
    }

    // Also include local wishlist set IDs
    wishlist.forEach((id) => {
      const strId = String(id);
      if (!seenIds.has(strId)) {
        seenIds.add(strId);
        const found = allProductsMap.get(strId);
        if (found) {
          items.push(found);
        } else {
          items.push({
            id,
            name: `Handloom Item #${id}`,
            cat: "Royal Weave",
            price: 1999, // default fallback
            image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
          });
        }
      }
    });

    return items;
  }, [wishlist, allProductsMap, serverWishlist]);

  function handleAddToBag(item) {
    addToCart(item);
    setWishlistOpen(false);
    setDrawerOpen(true);
  }

  return (
    <>
      {/* Background Backdrop */}
      <div
        onClick={() => setWishlistOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] transition-opacity duration-300 ${
          wishlistOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-[#FAF7F2] z-[101] shadow-2xl flex flex-col transition-transform duration-[400ms] ease-out border-l border-[#E6DFD3] ${
          wishlistOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#E6DFD3] bg-white">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-rust fill-rust/20" />
            <h3 className="font-serif text-xl font-bold text-charcoal">
              My Favorites ({wishlistItems.length})
            </h3>
          </div>
          <button
            onClick={() => setWishlistOpen(false)}
            className="p-1.5 text-charcoal/60 hover:text-charcoal hover:bg-[#FAF7F2] rounded-full transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Wishlist Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#E6DFD3]/60">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-20 px-4 text-charcoal/60 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#F4EEE3] flex items-center justify-center text-rust mb-4 shadow-inner">
                <Heart size={28} className="stroke-[1.5]" />
              </div>
              <h4 className="font-serif text-lg font-bold text-charcoal mb-1">Your wishlist is empty</h4>
              <p className="text-xs text-charcoal/60 max-w-xs mb-6">
                Explore our royal handloom collections and tap the heart icon on items you love.
              </p>
              <Link
                to="/shop"
                onClick={() => setWishlistOpen(false)}
                className="py-2.5 px-6 bg-rust text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-rust-deep transition-all shadow-xs"
              >
                Explore Collections
              </Link>
            </div>
          ) : (
            wishlistItems.map((item) => (
              <div key={item.id} className="flex gap-3.5 py-4 group">
                {/* Product Thumbnail */}
                <Link
                  to={`/product/${item.id}`}
                  onClick={() => setWishlistOpen(false)}
                  className="w-20 h-26 flex-shrink-0 bg-[#F4EEE3] overflow-hidden rounded-xs border border-[#E6DFD3]/70 relative group"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                {/* Details & Actions */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rust tracking-wider">
                      {item.subcat || item.cat}
                    </span>
                    <Link
                      to={`/product/${item.id}`}
                      onClick={() => setWishlistOpen(false)}
                      className="text-sm font-semibold text-charcoal hover:text-rust transition-colors block line-clamp-1 mt-0.5 leading-snug"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-serif font-bold text-sm text-charcoal">
                        {formatCurrency(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-charcoal/40 line-through">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Move to Bag & Remove) */}
                  <div className="flex items-center justify-between pt-2 border-t border-transparent">
                    <button
                      onClick={() => handleAddToBag(item)}
                      className="flex items-center gap-1.5 text-xs font-bold text-rust hover:text-rust-deep cursor-pointer transition-colors bg-[#F4EEE3] hover:bg-[#EFE6D5] px-3 py-1.5 rounded-full"
                    >
                      <ShoppingBag size={13} />
                      <span>Move to Bag</span>
                    </button>

                    <button
                      onClick={() => toggleWish(item.id)}
                      className="p-1.5 text-charcoal/40 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                      title="Remove from favorites"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {wishlistItems.length > 0 && (
          <div className="p-5 border-t border-[#E6DFD3] bg-white space-y-2.5">
            <Link
              to="/account/wishlist"
              onClick={() => setWishlistOpen(false)}
              className="w-full py-3 bg-[#FAF7F2] hover:bg-[#F4EEE3] border border-[#E6DFD3] text-charcoal text-xs uppercase font-bold tracking-wider rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>View Full Wishlist Page</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
