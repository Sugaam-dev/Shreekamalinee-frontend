import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useWishlistQuery } from "../../queries/useWishlistQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import AccountLayout from "../../components/layout/AccountLayout.jsx";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import useSEO from "../../hooks/useSEO.js";

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

export default function WishlistPage() {
  const { wishlist, toggleWish, addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { data: dbProducts = [] } = useProductsQuery();
  const { data: serverWishlist = [] } = useWishlistQuery(isAuthenticated);

  useSEO({
    title: "My Wishlist — Shreekamalinee",
    description: "Your saved royal handloom sarees and ethnic wear.",
  });

  const wishlistedItems = useMemo(() => {
    if (!wishlist || wishlist.size === 0) return [];

    const map = new Map();
    if (Array.isArray(dbProducts)) {
      dbProducts.forEach((p) => {
        const norm = normalizeWishlistItem(p);
        if (norm) map.set(String(p.id), norm);
      });
    }

    if (Array.isArray(serverWishlist)) {
      serverWishlist.forEach((p) => {
        const norm = normalizeWishlistItem(p);
        if (norm) map.set(String(p.id), norm);
      });
    }

    const items = [];
    const seenIds = new Set();

    wishlist.forEach((id) => {
      const strId = String(id);
      if (!seenIds.has(strId)) {
        seenIds.add(strId);
        const found = map.get(strId);
        if (found) {
          items.push(found);
        }
      }
    });

    return items;
  }, [wishlist, dbProducts, serverWishlist]);


  return (
    <AccountLayout
      title={`My Wishlist (${wishlistedItems.length})`}
      subtitle="Your personally curated handloom collection"
    >
      {wishlistedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 md:gap-6">
          {wishlistedItems.map((item) => (

            <div
              key={item.id}
              className="bg-white border border-line rounded-sm overflow-hidden flex flex-col justify-between shadow-xs group"
            >
              <div>
                <div className="aspect-[4/5] bg-cream-2 relative overflow-hidden">
                  <Link to={`/product/${item.id}`}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <button
                    onClick={() => toggleWish(item.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-sm hover:bg-white cursor-pointer transition-transform active:scale-90"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rust tracking-wider">
                    {item.subcat || item.cat}
                  </span>
                  <Link
                    to={`/product/${item.id}`}
                    className="font-serif font-bold text-sm text-charcoal hover:text-rust transition-colors block line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif font-bold text-sm text-charcoal">
                      {formatCurrency(item.price)}
                    </span>
                    {item.originalPrice && (
                      <span className="text-xs text-charcoal/40 line-through">
                        {formatCurrency(item.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    addToCart(item);
                  }}
                  icon={ShoppingBag}
                >
                  Move to Bag
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save your favorite handwoven weaves and ethnic attire here to easily review and buy them later."
          actionLabel="Explore Collections"
          actionTo="/shop"
        />
      )}
    </AccountLayout>
  );
}
