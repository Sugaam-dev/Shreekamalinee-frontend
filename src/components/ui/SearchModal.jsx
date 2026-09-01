import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, ArrowRight, TrendingUp, Sparkles, ShoppingBag } from "lucide-react";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { formatCurrency } from "../../utils/formatters.js";

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  const { data: dbProducts = [] } = useProductsQuery();
  const { data: dbCategories = [] } = useCategoriesQuery();

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "unset";
      setSearchTerm("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter products in real-time
  const matchedProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    const list = Array.isArray(dbProducts) ? dbProducts : [];
    return list
      .filter((p) => {
        const name = p.name || "";
        const cat = p.categoryName || p.category?.name || "";
        const brand = p.brand || "";
        return (
          name.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q) ||
          brand.toLowerCase().includes(q)
        );
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        cat: p.categoryName || p.category?.name || "Handloom",
        price: Number(p.offerPrice || p.price || p.originalPrice || 0),
        image:
          (Array.isArray(p.imageUrls) && p.imageUrls[0]) ||
          p.imageUrl ||
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      }))
      .slice(0, 6);
  }, [searchTerm, dbProducts]);

  // Filter matched categories & subcategories
  const matchedCategories = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    const results = [];
    const catList = Array.isArray(dbCategories) ? dbCategories : [];

    catList.forEach((cat) => {
      const catName = cat.name || "";
      if (catName.toLowerCase().includes(q)) {
        results.push({ type: "category", name: catName, path: `/shop?category=${encodeURIComponent(catName)}` });
      }
      if (Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach((sub) => {
          const subName = sub.name || sub;
          if (typeof subName === "string" && subName.toLowerCase().includes(q)) {
            results.push({
              type: "subcategory",
              name: `${subName} (${catName})`,
              path: `/shop?category=${encodeURIComponent(catName)}&subcat=${encodeURIComponent(subName)}`,
            });
          }
        });
      }
    });

    return results.slice(0, 4);
  }, [searchTerm, dbCategories]);


  const trendingTags = [
    "Paithani Sarees",
    "Maheshwari Silk",
    "Ikat Dress Material",
    "Ajrakh",
    "One Piece",
    "Paithani Clutches",
    "Festive Sarees",
  ];

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
    }
  };

  const handleTrendingClick = (tag) => {
    navigate(`/shop?search=${encodeURIComponent(tag)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-start">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/70 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Top Search Drawer Header */}
      <div className="relative w-full bg-[#FAF7F2] border-b border-[#E6DFD3] shadow-2xl z-10 animate-fadeIn">
        <div className="max-w-[1200px] min-[2000px]:max-w-[1600px] mx-auto px-6 md:px-10 py-6">
          {/* Top Row: Search Input & Close */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-line">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-1">
              <Search size={22} className="text-rust shrink-0 stroke-[2]" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by weave, fabric, saree style, color, or category..."
                className="w-full text-base sm:text-xl md:text-2xl font-serif text-charcoal bg-transparent outline-none placeholder:text-charcoal/35 placeholder:font-sans placeholder:text-sm sm:placeholder:text-lg"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-charcoal/40 hover:text-charcoal p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </form>

            <button
              onClick={onClose}
              className="p-2 text-charcoal/60 hover:text-rust hover:bg-cream-2 rounded-full transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider"
              aria-label="Close search"
            >
              <span className="hidden sm:inline">Close</span>
              <X size={20} />
            </button>
          </div>

          {/* Body Area */}
          <div className="py-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            {searchTerm.trim() ? (
              /* Live Results View */
              <div className="space-y-6">
                {/* Category Suggestions */}
                {matchedCategories.length > 0 && (
                  <div>
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-charcoal/50 mb-2">
                      Matching Collections & Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {matchedCategories.map((c, i) => (
                        <Link
                          key={i}
                          to={c.path}
                          onClick={onClose}
                          className="px-3 py-1.5 bg-cream-2 hover:bg-rust hover:text-white text-xs font-semibold text-charcoal rounded-sm transition-colors border border-line"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                {matchedProducts.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[11px] uppercase font-bold tracking-wider text-charcoal/50">
                        Products Matching "{searchTerm}"
                      </h4>
                      <button
                        onClick={handleSearchSubmit}
                        className="text-xs font-bold text-rust hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Results</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                      {matchedProducts.map((p) => (
                        <Link
                          key={p.id}
                          to={`/product/${p.id}`}
                          onClick={onClose}
                          className="group block bg-white border border-line rounded-sm overflow-hidden p-2 shadow-xs hover:border-rust/40 transition-all"
                        >
                          <div className="aspect-[4/5] bg-cream-2 rounded-xs overflow-hidden mb-2">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <span className="text-[9px] uppercase font-bold text-rust block line-clamp-1">
                            {p.subcat || p.cat}
                          </span>
                          <h5 className="font-serif text-xs font-bold text-charcoal line-clamp-1 group-hover:text-rust transition-colors">
                            {p.name}
                          </h5>
                          <span className="font-serif font-bold text-xs text-charcoal block mt-0.5">
                            {formatCurrency(p.price)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-charcoal/60">
                      No direct products matched <strong>"{searchTerm}"</strong>.
                    </p>
                    <button
                      onClick={handleSearchSubmit}
                      className="mt-3 px-4 py-2 bg-rust text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-rust-deep cursor-pointer"
                    >
                      Search Full Catalog
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Default Trending / Discover View */
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-rust flex items-center gap-1.5 mb-3">
                    <TrendingUp size={14} />
                    <span>Popular & Trending Searches</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTrendingClick(tag)}
                        className="px-3.5 py-1.5 bg-white hover:bg-rust hover:text-white border border-line text-xs font-medium text-charcoal/80 rounded-full transition-all cursor-pointer shadow-xs hover:border-rust"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <h4 className="text-[11px] uppercase font-bold tracking-wider text-charcoal/50 mb-3">
                    Explore Handloom Categories
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(dbCategories.length > 0 ? dbCategories.slice(0, 4) : []).map((cat) => (
                      <Link
                        key={cat.id || cat.name}
                        to={`/shop?category=${encodeURIComponent(cat.name)}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2.5 bg-white border border-line rounded-sm hover:border-rust/50 transition-colors shadow-xs group"
                      >
                        <img
                          src={cat.imageUrl || cat.image || "/images/placeholder-saree.jpg"}
                          alt={cat.name}
                          className="w-10 h-10 object-cover rounded-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <strong className="text-xs text-charcoal group-hover:text-rust transition-colors block truncate">
                            {cat.name}
                          </strong>
                          <span className="text-[10px] text-rust font-semibold">
                            Explore →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
