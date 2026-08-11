import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { PRODUCTS, COLLECTION_CATEGORIES } from "../../data/products/products.js";
import ProductCard from "../../components/cards/ProductCard.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function Shop() {
  const [searchParams] = useSearchParams();

  // Initialise filter state from URL query params (set by Collection section)
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get("category") || "All"
  );
  const [selectedSubcat, setSelectedSubcat] = useState(
    () => searchParams.get("subcat") || "All"
  );
  const [sort, setSort] = useState("featured");
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") || ""
  );
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync filter state when URL params change (e.g. navigating between Collection chips)
  useEffect(() => {
    const cat = searchParams.get("category") || "All";
    const sub = searchParams.get("subcat") || "All";
    const q = searchParams.get("search") || "";
    setSelectedCategory(cat);
    setSelectedSubcat(sub);
    setSearchQuery(q);
    // Reset sidebar-only filters when collection changes via URL
    setSelectedSeason("All");
    setPriceFilter("All");
    setStockFilter("All");
    setSort("featured");
  }, [searchParams]);

  useSEO({
    title: selectedSubcat !== "All"
      ? `${selectedSubcat} (${selectedCategory})`
      : selectedCategory !== "All"
      ? `${selectedCategory} Collection`
      : "Shop Indian Heritage Collection",
    description: selectedSubcat !== "All"
      ? `Explore handcrafted ${selectedSubcat} in our ${selectedCategory} category. Authentically sourced from traditional Indian weavers.`
      : selectedCategory !== "All"
      ? `Discover premium hand-woven ${selectedCategory} at Shreekamalinee. Handloom heritage textiles tailor-made for elegant occasions.`
      : "Browse the full collection of Shreekamalinee heritage sarees, unstitched suit materials, and handcrafted lifestyle accessories."
  });

  // Core categories for navigation and sidebar filtering
  const mainCategories = ["All", "Sarees", "Dress Material", "Readymade", "Accessories"];

  // Subcategories available for the selected main category (from COLLECTION_CATEGORIES structure)
  const availableSubcats = useMemo(() => {
    if (selectedCategory === "All") return [];
    
    // Map internal category name to COLLECTION_CATEGORIES category name
    const mappedCatName = selectedCategory === "Women Accessories" ? "Accessories" : selectedCategory;
    const catConfig = COLLECTION_CATEGORIES.find((c) => c.name === mappedCatName);
    return catConfig ? catConfig.subcats : [];
  }, [selectedCategory]);

  // ── Core filter + sort logic ──
  const items = useMemo(() => {
    let list = [...PRODUCTS];

    // 1. Main category filter
    if (selectedCategory !== "All") {
      list = list.filter((p) => {
        if (selectedCategory === "Accessories") {
          return p.cat === "Women Accessories" || p.cat === "Accessories";
        }
        return p.cat === selectedCategory;
      });
    }

    // 2. Subcategory filter — always combined with category, never standalone
    if (selectedSubcat !== "All") {
      list = list.filter((p) => p.subcat === selectedSubcat);
    }

    // 3. Season filter
    if (selectedSeason !== "All") {
      list = list.filter((p) => p.season === selectedSeason);
    }

    // 4. Price filter
    if (priceFilter === "under2k") list = list.filter((p) => p.price < 2000);
    if (priceFilter === "2k5k")   list = list.filter((p) => p.price >= 2000 && p.price <= 5000);
    if (priceFilter === "over5k") list = list.filter((p) => p.price > 5000);

    // 5. Stock filter
    if (stockFilter === "inStock") list = list.filter((p) => !p.isSoldOut);
    if (stockFilter === "soldOut") list = list.filter((p) => p.isSoldOut);

    // 6. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cat.toLowerCase().includes(q) ||
          (p.subcat && p.subcat.toLowerCase().includes(q))
      );
    }

    // 7. Sort
    if (sort === "low")  list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);

    return list;
  }, [selectedCategory, selectedSubcat, selectedSeason, priceFilter, stockFilter, searchQuery, sort]);

  // True when the listing is empty due to a specific subcat having no products yet
  // (as opposed to user-applied secondary filters returning no results)
  const isSubcatEmptyState =
    selectedSubcat !== "All" &&
    items.length === 0 &&
    selectedSeason === "All" &&
    priceFilter === "All" &&
    !searchQuery.trim();

  function handleCategoryChange(val) {
    setSelectedCategory(val);
    setSelectedSubcat("All"); // reset subcat whenever main category changes
  }

  function handleResetFilters() {
    setSelectedCategory("All");
    setSelectedSubcat("All");
    setSelectedSeason("All");
    setPriceFilter("All");
    setStockFilter("All");
    setSearchQuery("");
    setSort("featured");
  }

  // ── Page heading helpers ──
  const breadcrumbLabel =
    selectedCategory !== "All" && selectedSubcat !== "All"
      ? `${selectedCategory} · ${selectedSubcat}`
      : selectedCategory !== "All"
      ? selectedCategory
      : "All Collections";

  const pageSubLabel =
    selectedCategory !== "All" && selectedSubcat !== "All"
      ? `${selectedSubcat} — ${selectedCategory}`
      : selectedCategory !== "All"
      ? `${selectedCategory} Collection`
      : "Bestsellers";

  // ── Filter content (shared by desktop sidebar + mobile drawer) ──
  function FilterContent() {
    return (
      <div className="space-y-8 animate-fadeIn">

        {/* Search */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
            Search Products
          </h4>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-9 pr-8 py-2.5 border border-line bg-white text-xs outline-none focus:border-rust transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
              <Search size={14} className="stroke-[1.8]" />
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-rust cursor-pointer flex items-center"
              >
                <X size={14} className="stroke-[1.8]" />
              </button>
            )}
          </div>
        </div>

        {/* Main Category */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
            Category
          </h4>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full border border-line bg-white text-xs px-3 py-2.5 outline-none cursor-pointer hover:border-rust transition-colors"
          >
            {mainCategories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory — only shown when a main category is selected AND it has subcat data */}
        {selectedCategory !== "All" && availableSubcats.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
              Type / Subcategory
            </h4>
            <select
              value={selectedSubcat}
              onChange={(e) => setSelectedSubcat(e.target.value)}
              className="w-full border border-line bg-white text-xs px-3 py-2.5 outline-none cursor-pointer hover:border-rust transition-colors"
            >
              <option value="All">All Types</option>
              {availableSubcats.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Season */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
            Season Drop
          </h4>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full border border-line bg-white text-xs px-3 py-2.5 outline-none cursor-pointer hover:border-rust transition-colors"
          >
            <option value="All">All Seasons</option>
            <option value="Summer">Summer Drop</option>
            <option value="Autumn">Autumn Edit</option>
            <option value="Festive">Festive Edit</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
            Price Bracket
          </h4>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="w-full border border-line bg-white text-xs px-3 py-2.5 outline-none cursor-pointer hover:border-rust transition-colors"
          >
            <option value="All">All Prices</option>
            <option value="under2k">Under ₹2,000</option>
            <option value="2k5k">₹2,000 – ₹5,000</option>
            <option value="over5k">Over ₹5,000</option>
          </select>
        </div>

        {/* Availability */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
            Stock Availability
          </h4>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full border border-line bg-white text-xs px-3 py-2.5 outline-none cursor-pointer hover:border-rust transition-colors font-medium"
          >
            <option value="All font-semibold">All Items (In Stock & Sold Out)</option>
            <option value="inStock">In Stock Only (Folder Images)</option>
            <option value="soldOut">Sold Out Only</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40 font-bold mb-3">
            Sort List
          </h4>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full border border-line bg-white text-xs px-3 py-2.5 outline-none cursor-pointer hover:border-rust transition-colors"
          >
            <option value="featured">Sort: Featured</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="w-full py-2.5 border border-line text-[11px] font-bold uppercase tracking-wider text-charcoal/60 hover:text-rust hover:border-rust transition-colors bg-white cursor-pointer"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <section id="shop" className="py-16 md:py-24">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">

        {/* Page Header */}
        <div className="mb-14">
          <span className="block text-xs tracking-[0.2em] uppercase text-rust mb-2 font-semibold">
            {pageSubLabel}
          </span>
          <h1 className="font-serif font-medium text-3xl md:text-5xl text-charcoal">
            {selectedSubcat !== "All" ? selectedSubcat : selectedCategory !== "All" ? selectedCategory : "Loved This Season"}
          </h1>
          <div className="w-12 h-0.5 bg-rust mt-4" />
        </div>

        {/* Mobile Filter Trigger */}
        <div className="flex lg:hidden justify-between items-center pb-5 mb-8 border-b border-line">
          <span className="text-sm text-charcoal/50 font-medium">{items.length} products found</span>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2.5 px-4.5 py-2.5 border border-line rounded-full text-[11px] font-bold uppercase tracking-wider bg-white hover:border-rust hover:text-rust transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={13} className="stroke-[1.8]" />
            <span>Filters</span>
          </button>
        </div>

        {/* Desktop Layout: Sidebar + Grid */}
        <div className="grid lg:grid-cols-[250px_1fr] gap-12 items-start">

          {/* Sticky sidebar (desktop only) */}
          <aside className="hidden lg:block w-[250px] sticky top-28 self-start bg-cream-2/20 p-6 border border-line rounded-sm shadow-xs">
            {FilterContent()}
          </aside>

          {/* Product grid */}
          <div className="flex-grow">
            {/* Desktop count row with breadcrumb */}
            <div className="hidden lg:flex justify-between items-center pb-4 mb-8 border-b border-line text-xs tracking-wider text-charcoal/40 uppercase font-semibold">
              <span>{items.length} styles available</span>
              <span>Showing: {breadcrumbLabel}</span>
            </div>

            {/* ── Empty States ── */}
            {isSubcatEmptyState ? (
              // Subcategory has no products yet — coming soon state
              <div className="text-center py-24 border border-dashed border-line rounded-sm bg-cream-2/10">
                <div className="text-5xl mb-5">🪡</div>
                <h3 className="font-serif text-xl font-medium text-charcoal mb-2">
                  Coming Soon
                </h3>
                <p className="text-sm text-charcoal/50 mb-1 max-w-xs mx-auto leading-relaxed">
                  No products available in this collection yet.
                </p>
                <p className="text-xs text-charcoal/35 mb-6">
                  We're adding new pieces regularly — check back soon.
                </p>
                <Link
                  to="/product"
                  className="inline-block px-6 py-2.5 bg-charcoal text-cream text-xs uppercase tracking-wider font-semibold hover:bg-rust transition-colors"
                >
                  Browse All Collections
                </Link>
              </div>
            ) : items.length === 0 ? (
              // Secondary filters returned no results
              <div className="text-center py-24 text-charcoal/50 bg-cream-2/10 border border-dashed border-line">
                <Search size={36} className="mx-auto text-charcoal/30 mb-4 stroke-[1.5]" />
                <p className="text-sm font-medium">No products match your search criteria.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-5 py-2 bg-charcoal text-cream text-xs uppercase tracking-wider font-semibold hover:bg-rust transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {mobileFiltersOpen && (
        <>
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-charcoal/50 z-[110] transition-opacity duration-300 animate-fadeIn"
          />
          <aside className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[85vw] bg-cream z-[120] shadow-2xl p-7 overflow-y-auto flex flex-col justify-between border-l border-line transition-transform duration-300 animate-slideLeft">
            <div>
              <div className="flex justify-between items-center pb-5 mb-8 border-b border-line">
                <h3 className="font-serif text-xl font-bold text-charcoal">Filter Catalog</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-charcoal/50 hover:text-rust cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-cream-2/40 transition-colors"
                >
                  <X size={20} className="stroke-[1.8]" />
                </button>
              </div>
              {FilterContent()}
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
