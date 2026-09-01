import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Star,
  Check,
  ChevronRight,
  Package,
  Layers,
} from "lucide-react";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import ProductCard from "../../components/cards/ProductCard.jsx";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Fetch live products and categories from backend DB
  const { data: dbProducts = [], isLoading: isProductsLoading } = useProductsQuery();
  const { data: dbCategories = [], isLoading: isCategoriesLoading } = useCategoriesQuery();

  // URL searchParams sync
  const categoryParam = searchParams.get("category");
  const subcatParam = searchParams.get("subcat");
  const searchParam = searchParams.get("search");

  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "All");
  const [selectedSubcat, setSelectedSubcat] = useState(subcatParam || "All");
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [sort, setSort] = useState("featured");
  const [columns, setColumns] = useState(4); // 3 or 4 columns grid

  // 7-Level Multi-Filter States
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearchInput, setBrandSearchInput] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [discountFilter, setDiscountFilter] = useState(0);
  const [pricePreset, setPricePreset] = useState("All");
  const [customMinPrice, setCustomMinPrice] = useState("");
  const [customMaxPrice, setCustomMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState("All"); // "All", "inStock", "soldOut"

  // Mobile Filter Drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Flipkart style collapsible accordion state
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    brand: true,
    occasion: true,
    rating: true,
    discount: true,
    availability: true,
  });

  const toggleSection = (sec) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Sync state when URL searchParams change
  useEffect(() => {
    setSelectedCategory(categoryParam || "All");
    setSelectedSubcat(subcatParam || "All");
    setSearchQuery(searchParam || "");
  }, [categoryParam, subcatParam, searchParam]);

  // Categories Structure from DB
  const categoryTree = useMemo(() => {
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      const rootCats = dbCategories.filter((c) => !c.parentId);
      return rootCats.map((root) => {
        const children = dbCategories.filter((c) => c.parentId === root.id);
        return {
          id: root.id,
          name: root.name,
          subcats: children.map((ch) => ({ id: ch.id, name: ch.name })),
        };
      });
    }
    return [];
  }, [dbCategories]);

  // Contextual Facet & Filter Predicates
  const matchSearch = (p, q) => {
    if (!q || !q.trim()) return true;
    const s = q.toLowerCase().trim();
    return (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.brand && p.brand.toLowerCase().includes(s)) ||
      (p.description && p.description.toLowerCase().includes(s)) ||
      (p.color && p.color.toLowerCase().includes(s)) ||
      (p.fabric && p.fabric.toLowerCase().includes(s)) ||
      (p.highlights &&
        Object.values(p.highlights).some((v) =>
          String(v).toLowerCase().includes(s)
        ))
    );
  };

  const matchCategory = (p, cat, tree) => {
    if (cat === "All") return true;
    const selectedTree = tree.find(
      (c) => c.name.toLowerCase() === cat.toLowerCase()
    );
    if (selectedTree) {
      const allowedCategoryIds = [
        selectedTree.id,
        ...selectedTree.subcats.map((s) => s.id),
      ];
      if (p.categoryId) return allowedCategoryIds.includes(p.categoryId);
      return (
        (p.cat && p.cat.toLowerCase() === cat.toLowerCase()) ||
        (p.categoryName && p.categoryName.toLowerCase() === cat.toLowerCase()) ||
        (p.parentCategoryName && p.parentCategoryName.toLowerCase() === cat.toLowerCase())
      );
    }
    return (
      (p.cat && p.cat.toLowerCase() === cat.toLowerCase()) ||
      (p.categoryName && p.categoryName.toLowerCase() === cat.toLowerCase())
    );
  };

  const matchSubcategory = (p, sub, cats) => {
    if (sub === "All") return true;
    const selectedSub = cats.find(
      (c) => c.name.toLowerCase() === sub.toLowerCase()
    );
    if (selectedSub && p.categoryId === selectedSub.id) return true;
    if (p.categoryName && p.categoryName.toLowerCase() === sub.toLowerCase()) return true;
    return p.subcat && p.subcat.toLowerCase() === sub.toLowerCase();
  };

  const matchPrice = (p, preset, minP, maxP) => {
    const price = p.offerPrice ?? p.price ?? p.originalPrice ?? 0;
    if (preset === "under2k" && price >= 2000) return false;
    if (preset === "2k5k" && (price < 2000 || price > 5000)) return false;
    if (preset === "5k10k" && (price <= 5000 || price > 10000)) return false;
    if (preset === "over10k" && price <= 10000) return false;
    if (minP !== "") {
      const min = Number(minP);
      if (!isNaN(min) && price < min) return false;
    }
    if (maxP !== "") {
      const max = Number(maxP);
      if (!isNaN(max) && price > max) return false;
    }
    return true;
  };

  const matchStock = (p, stock) => {
    if (stock === "All") return true;
    const totalStock = p.variants?.reduce(
      (sum, v) => sum + (v.stockQuantity || 0),
      0
    );
    const isSoldOut = p.isSoldOut || (p.variants?.length > 0 && totalStock === 0);
    if (stock === "inStock") return !isSoldOut;
    if (stock === "soldOut") return isSoldOut;
    return true;
  };

  const matchBrand = (p, brands) => {
    if (!brands || brands.length === 0) return true;
    return brands.includes(p.brand || "Shreekamalinee");
  };

  const matchSeason = (p, season) => {
    if (season === "All") return true;
    const sf = season.toLowerCase();
    return (
      (p.season && p.season.toLowerCase() === sf) ||
      (p.occasion && p.occasion.toLowerCase() === sf) ||
      (p.description && p.description.toLowerCase().includes(sf))
    );
  };

  // 1. Dynamic Contextual Category & Subcategory Counts
  const { categoryCounts, subcategoryCounts } = useMemo(() => {
    const catCounts = {};
    const subCounts = {};

    dbCategories.forEach((c) => {
      catCounts[c.id] = 0;
      catCounts[c.name.toLowerCase()] = 0;
      subCounts[c.id] = 0;
      subCounts[c.name.toLowerCase()] = 0;
    });

    // Count products matching active search, price, stock, brand, and season
    dbProducts.forEach((p) => {
      if (
        matchSearch(p, searchQuery) &&
        matchPrice(p, pricePreset, customMinPrice, customMaxPrice) &&
        matchStock(p, stockFilter) &&
        matchBrand(p, selectedBrands) &&
        matchSeason(p, seasonFilter)
      ) {
        if (p.categoryId) {
          catCounts[p.categoryId] = (catCounts[p.categoryId] || 0) + 1;
          subCounts[p.categoryId] = (subCounts[p.categoryId] || 0) + 1;
        }
        if (p.categoryName) {
          const cn = p.categoryName.toLowerCase();
          catCounts[cn] = (catCounts[cn] || 0) + 1;
          subCounts[cn] = (subCounts[cn] || 0) + 1;
        }
      }
    });

    // Roll up subcategory counts into parent root category counts
    dbCategories.forEach((sub) => {
      if (sub.parentId) {
        const count = subCounts[sub.id] || 0;
        catCounts[sub.parentId] = (catCounts[sub.parentId] || 0) + count;
      }
    });

    return { categoryCounts: catCounts, subcategoryCounts: subCounts };
  }, [
    dbProducts,
    dbCategories,
    searchQuery,
    pricePreset,
    customMinPrice,
    customMaxPrice,
    stockFilter,
    selectedBrands,
    seasonFilter,
  ]);

  // Current category subcategories list and total count for top quick-filter
  const currentCategorySubcats = useMemo(() => {
    if (selectedCategory === "All") return [];
    const currentTree = categoryTree.find(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    return currentTree?.subcats || [];
  }, [selectedCategory, categoryTree]);

  const currentCategoryTotalCount = useMemo(() => {
    if (selectedCategory === "All") return dbProducts.length;
    const currentTree = categoryTree.find(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!currentTree) return 0;
    return categoryCounts[currentTree.id] || categoryCounts[currentTree.name.toLowerCase()] || 0;
  }, [selectedCategory, categoryTree, categoryCounts, dbProducts.length]);

  // 2. Dynamic Contextual Brands (reflects selected Category, Subcategory, Search, Price, Season)
  const allBrandsList = useMemo(() => {
    const brandCounts = {};
    dbProducts.forEach((p) => {
      if (
        matchCategory(p, selectedCategory, categoryTree) &&
        matchSubcategory(p, selectedSubcat, dbCategories) &&
        matchSearch(p, searchQuery) &&
        matchPrice(p, pricePreset, customMinPrice, customMaxPrice) &&
        matchStock(p, stockFilter) &&
        matchSeason(p, seasonFilter)
      ) {
        const b = p.brand || "Shreekamalinee";
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
    });

    return Object.entries(brandCounts).map(([name, count]) => ({ name, count }));
  }, [
    dbProducts,
    selectedCategory,
    categoryTree,
    selectedSubcat,
    dbCategories,
    searchQuery,
    pricePreset,
    customMinPrice,
    customMaxPrice,
    stockFilter,
    seasonFilter,
  ]);

  // 3. Dynamic Contextual Seasons (reflects selected Category, Subcategory, Search, Price, Brand)
  const seasonsList = useMemo(() => {
    const seasonCounts = {};
    dbProducts.forEach((p) => {
      if (
        matchCategory(p, selectedCategory, categoryTree) &&
        matchSubcategory(p, selectedSubcat, dbCategories) &&
        matchSearch(p, searchQuery) &&
        matchPrice(p, pricePreset, customMinPrice, customMaxPrice) &&
        matchStock(p, stockFilter) &&
        matchBrand(p, selectedBrands)
      ) {
        if (p.season && p.season.trim()) {
          const s = p.season.trim();
          seasonCounts[s] = (seasonCounts[s] || 0) + 1;
        }
      }
    });

    return Object.entries(seasonCounts).map(([name, count]) => ({ name, count }));
  }, [
    dbProducts,
    selectedCategory,
    categoryTree,
    selectedSubcat,
    dbCategories,
    searchQuery,
    pricePreset,
    customMinPrice,
    customMaxPrice,
    stockFilter,
    selectedBrands,
  ]);

  // Dynamic SEO
  useSEO({
    title:
      selectedCategory !== "All"
        ? `${selectedCategory} Collection`
        : "Public Store Catalog & Handlooms",
    description: `Explore authentic handloom sarees, artisanal weaves, and ethnic ensembles certified with genuine Silk Mark at Shreekamalinee.`,
  });

  // Filter & Search Evaluation matching Spring Boot Catalog API & Frontend
  const filteredProducts = useMemo(() => {
    let list = [...dbProducts];

    // 1. Category Filter
    if (selectedCategory !== "All") {
      const selectedTree = categoryTree.find(
        (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (selectedTree) {
        const allowedCategoryIds = [
          selectedTree.id,
          ...selectedTree.subcats.map((s) => s.id),
        ];
        list = list.filter((p) => {
          if (p.categoryId) return allowedCategoryIds.includes(p.categoryId);
          return (
            (p.cat && p.cat.toLowerCase() === selectedCategory.toLowerCase()) ||
            (p.categoryName &&
              p.categoryName.toLowerCase() === selectedCategory.toLowerCase())
          );
        });
      }
    }

    // 2. Subcategory Filter
    if (selectedSubcat !== "All") {
      const selectedSub = dbCategories.find(
        (c) => c.name.toLowerCase() === selectedSubcat.toLowerCase()
      );
      list = list.filter((p) => {
        if (selectedSub && p.categoryId === selectedSub.id) return true;
        return (
          p.subcat && p.subcat.toLowerCase() === selectedSubcat.toLowerCase()
        );
      });
    }

    // 3. Search Query Filter (Matches Name, SKU, Brand, Fabric, Color, Description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.color && p.color.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q)) ||
          (p.highlights &&
            Object.values(p.highlights).some((v) =>
              String(v).toLowerCase().includes(q)
            ))
      );
    }

    // 4. Season / Occasion Filter
    if (seasonFilter !== "All") {
      const sf = seasonFilter.toLowerCase();
      list = list.filter(
        (p) =>
          (p.season && p.season.toLowerCase() === sf) ||
          (p.occasion && p.occasion.toLowerCase() === sf) ||
          (p.description && p.description.toLowerCase().includes(sf)) ||
          (p.highlights &&
            Object.values(p.highlights).some((v) =>
              String(v).toLowerCase().includes(sf)
            ))
      );
    }

    // 5. Brand Filter (Multiple select)
    if (selectedBrands.length > 0) {
      list = list.filter((p) =>
        selectedBrands.includes(p.brand || "Shreekamalinee")
      );
    }

    // 6. Rating Filter
    if (ratingFilter > 0) {
      list = list.filter((p) => (p.rating || 4.8) >= ratingFilter);
    }

    // 7. Discount Filter
    if (discountFilter > 0) {
      list = list.filter((p) => {
        const selling = p.offerPrice ?? p.price ?? p.originalPrice ?? 0;
        const mrp = p.originalPrice ?? p.mrp ?? selling;
        const disc = mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;
        return disc >= discountFilter;
      });
    }

    // 8. Price Preset or Custom Min/Max
    list = list.filter((p) => {
      const price = p.offerPrice ?? p.price ?? p.originalPrice ?? 0;

      if (pricePreset === "under2k" && price >= 2000) return false;
      if (pricePreset === "2k5k" && (price < 2000 || price > 5000)) return false;
      if (pricePreset === "5k10k" && (price <= 5000 || price > 10000)) return false;
      if (pricePreset === "over10k" && price <= 10000) return false;

      if (customMinPrice !== "") {
        const min = Number(customMinPrice);
        if (!isNaN(min) && price < min) return false;
      }
      if (customMaxPrice !== "") {
        const max = Number(customMaxPrice);
        if (!isNaN(max) && price > max) return false;
      }

      return true;
    });

    // 9. In Stock Filter
    if (stockFilter !== "All") {
      list = list.filter((p) => {
        const totalStock = p.variants?.reduce(
          (sum, v) => sum + (v.stockQuantity || 0),
          0
        );
        const isSoldOut =
          p.isSoldOut || (p.variants?.length > 0 && totalStock === 0);

        if (stockFilter === "inStock") return !isSoldOut;
        if (stockFilter === "soldOut") return isSoldOut;
        return true;
      });
    }

    // 10. Sort Order
    if (sort === "price-low") {
      list.sort((a, b) => {
        const pA = a.offerPrice ?? a.price ?? a.originalPrice ?? 0;
        const pB = b.offerPrice ?? b.price ?? b.originalPrice ?? 0;
        return pA - pB;
      });
    } else if (sort === "price-high") {
      list.sort((a, b) => {
        const pA = a.offerPrice ?? a.price ?? a.originalPrice ?? 0;
        const pB = b.offerPrice ?? b.price ?? b.originalPrice ?? 0;
        return pB - pA;
      });
    } else if (sort === "rating") {
      list.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    } else if (sort === "discount") {
      list.sort((a, b) => {
        const discA =
          (a.originalPrice ?? a.price) > (a.offerPrice ?? a.price)
            ? (a.originalPrice - (a.offerPrice ?? a.price)) / a.originalPrice
            : 0;
        const discB =
          (b.originalPrice ?? b.price) > (b.offerPrice ?? b.price)
            ? (b.originalPrice - (b.offerPrice ?? b.price)) / b.originalPrice
            : 0;
        return discB - discA;
      });
    } else if (sort === "newest") {
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return list;
  }, [
    dbProducts,
    dbCategories,
    categoryTree,
    selectedCategory,
    selectedSubcat,
    searchQuery,
    seasonFilter,
    selectedBrands,
    ratingFilter,
    discountFilter,
    pricePreset,
    customMinPrice,
    customMaxPrice,
    stockFilter,
    sort,
  ]);

  // Brand Toggle handler
  const handleBrandToggle = (brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName]
    );
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedCategory("All");
    setSelectedSubcat("All");
    setSearchQuery("");
    setSeasonFilter("All");
    setSelectedBrands([]);
    setRatingFilter(0);
    setDiscountFilter(0);
    setPricePreset("All");
    setCustomMinPrice("");
    setCustomMaxPrice("");
    setStockFilter("All");
    setSort("featured");
    setSearchParams({});
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubcat("All");
    const params = new URLSearchParams(searchParams);
    if (cat === "All") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    params.delete("subcat");
    setSearchParams(params);
  };

  const handleSubcatClick = (sub) => {
    setSelectedSubcat(sub);
    const params = new URLSearchParams(searchParams);
    if (sub === "All") {
      params.delete("subcat");
    } else {
      params.set("subcat", sub);
    }
    setSearchParams(params);
  };

  const activeFiltersCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedSubcat !== "All" ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (seasonFilter !== "All" ? 1 : 0) +
    selectedBrands.length +
    (ratingFilter > 0 ? 1 : 0) +
    (discountFilter > 0 ? 1 : 0) +
    (pricePreset !== "All" || customMinPrice !== "" || customMaxPrice !== ""
      ? 1
      : 0) +
    (stockFilter !== "All" ? 1 : 0);

  // Flipkart Style Filter Content Component (Shared by Desktop & Mobile Drawer)
  const FilterContent = (
    <div className="divide-y divide-gray-200 text-xs">
      {/* 1. CATEGORIES ACCORDION */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Categories & Weaves</span>
          {expandedSections.categories ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.categories && (
          <div className="mt-3 space-y-1 pl-1">
            <div
              onClick={() => handleCategoryClick("All")}
              className={`flex items-center justify-between py-1 px-2 rounded-xs cursor-pointer transition-colors ${
                selectedCategory === "All"
                  ? "font-bold text-[#800020] bg-[#800020]/5"
                  : "text-gray-700 hover:text-[#800020]"
              }`}
            >
              <span>All Collections</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-gray-400">({dbProducts.length})</span>
                {selectedCategory === "All" && (
                  <Check size={13} className="text-[#800020]" />
                )}
              </div>
            </div>

            {categoryTree.map((c) => {
              const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase();
              const count = categoryCounts[c.id] || categoryCounts[c.name.toLowerCase()] || 0;
              return (
                <div key={c.name} className="space-y-1">
                  <div
                    onClick={() => handleCategoryClick(c.name)}
                    className={`flex items-center justify-between py-1 px-2 rounded-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "font-bold text-[#800020] bg-[#800020]/5"
                        : "text-gray-700 hover:text-[#800020]"
                    }`}
                  >
                    <span>{c.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] text-gray-400">({count})</span>
                      {isSelected && (
                        <Check size={13} className="text-[#800020]" />
                      )}
                    </div>
                  </div>

                  {/* Subcategories when category is selected */}
                  {isSelected && c.subcats.length > 0 && (
                    <div className="pl-3 py-1 space-y-1 border-l-2 border-[#800020]/20 ml-2">
                      <div
                        onClick={() => handleSubcatClick("All")}
                        className={`text-[11px] py-0.5 px-1.5 rounded-xs cursor-pointer flex items-center justify-between ${
                          selectedSubcat === "All"
                            ? "font-bold text-[#800020]"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span>• All {c.name}</span>
                        <span className="text-[10px] text-gray-400">({count})</span>
                      </div>
                      {c.subcats.map((sub) => {
                        const subCount = subcategoryCounts[sub.id] || subcategoryCounts[sub.name.toLowerCase()] || 0;
                        const isSubSelected = selectedSubcat.toLowerCase() === sub.name.toLowerCase();
                        return (
                          <div
                            key={sub.name}
                            onClick={() => handleSubcatClick(sub.name)}
                            className={`text-[11px] py-0.5 px-1.5 rounded-xs cursor-pointer flex items-center justify-between ${
                              isSubSelected
                                ? "font-bold text-[#800020] bg-[#800020]/10"
                                : "text-gray-600 hover:text-[#800020]"
                            }`}
                          >
                            <span>{sub.name}</span>
                            <span className="text-[10px] text-gray-400">({subCount})</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. PRICE ACCORDION (Dual Dropdowns & Presets) */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Price Range</span>
          {expandedSections.price ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.price && (
          <div className="mt-3 space-y-3">
            {/* Min to Max Dual Selectors */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">
                  Min Price
                </label>
                <select
                  value={customMinPrice}
                  onChange={(e) => {
                    setCustomMinPrice(e.target.value);
                    setPricePreset("custom");
                  }}
                  className="w-full text-xs border border-gray-300 rounded-xs py-1.5 px-2 bg-white outline-none focus:border-[#800020]"
                >
                  <option value="">Min (₹0)</option>
                  <option value="1000">₹1,000</option>
                  <option value="2000">₹2,000</option>
                  <option value="5000">₹5,000</option>
                  <option value="10000">₹10,000</option>
                  <option value="20000">₹20,000</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">
                  Max Price
                </label>
                <select
                  value={customMaxPrice}
                  onChange={(e) => {
                    setCustomMaxPrice(e.target.value);
                    setPricePreset("custom");
                  }}
                  className="w-full text-xs border border-gray-300 rounded-xs py-1.5 px-2 bg-white outline-none focus:border-[#800020]"
                >
                  <option value="">Max (₹50k+)</option>
                  <option value="5000">₹5,000</option>
                  <option value="10000">₹10,000</option>
                  <option value="20000">₹20,000</option>
                  <option value="35000">₹35,000</option>
                  <option value="50000">₹50,000</option>
                </select>
              </div>
            </div>

            {/* Quick Radio Presets */}
            <div className="space-y-1.5 pt-1">
              {[
                { id: "All", label: "All Price Ranges" },
                { id: "under2k", label: "Under ₹2,000" },
                { id: "2k5k", label: "₹2,000 - ₹5,000" },
                { id: "5k10k", label: "₹5,000 - ₹10,000" },
                { id: "over10k", label: "Above ₹10,000" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-[#800020] text-xs"
                >
                  <input
                    type="radio"
                    name="price_opt"
                    checked={pricePreset === opt.id}
                    onChange={() => {
                      setPricePreset(opt.id);
                      setCustomMinPrice("");
                      setCustomMaxPrice("");
                    }}
                    className="accent-[#800020]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. BRAND ACCORDION (With In-filter Search & Counts) */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("brand")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Brand / Atelier</span>
          {expandedSections.brand ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.brand && (
          <div className="mt-3 space-y-2.5">
            {/* Search Brand Input */}
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search Brand"
                value={brandSearchInput}
                onChange={(e) => setBrandSearchInput(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-200 rounded-xs outline-none bg-gray-50 focus:bg-white focus:border-[#800020]"
              />
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pt-1">
              {allBrandsList
                .filter((b) =>
                  b.name
                    .toLowerCase()
                    .includes(brandSearchInput.toLowerCase().trim())
                )
                .map((b) => {
                  const isChecked = selectedBrands.includes(b.name);
                  return (
                    <label
                      key={b.name}
                      className="flex items-center justify-between gap-2 cursor-pointer text-gray-700 hover:text-gray-900 text-xs py-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBrandToggle(b.name)}
                          className="accent-[#800020] rounded-xs"
                        />
                        <span
                          className={isChecked ? "font-bold text-[#800020]" : ""}
                        >
                          {b.name}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-gray-400">
                        ({b.count})
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 4. OCCASION / SEASON ACCORDION */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("occasion")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Occasion & Season</span>
          {expandedSections.occasion ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.occasion && (
          <div className="mt-3 space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-[#800020] text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="season_opt"
                  checked={seasonFilter === "All"}
                  onChange={() => setSeasonFilter("All")}
                  className="accent-[#800020]"
                />
                <span>All Occasions</span>
              </div>
              <span className="text-[10.5px] text-gray-400">({dbProducts.length})</span>
            </label>

            {seasonsList.map((s) => (
              <label
                key={s.name}
                className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-[#800020] text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="season_opt"
                    checked={seasonFilter === s.name}
                    onChange={() => setSeasonFilter(s.name)}
                    className="accent-[#800020]"
                  />
                  <span className={seasonFilter === s.name ? "font-bold text-[#800020]" : ""}>
                    {s.name}
                  </span>
                </div>
                <span className="text-[10.5px] text-gray-400">({s.count})</span>
              </label>
            ))}

            {seasonsList.length === 0 && (
              <span className="text-[11px] text-gray-400 block italic">No specific season tags in catalog</span>
            )}
          </div>
        )}
      </div>

      {/* 5. CUSTOMER RATINGS ACCORDION */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("rating")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Customer Ratings</span>
          {expandedSections.rating ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.rating && (
          <div className="mt-3 space-y-1.5">
            {[4, 3, 2].map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900 text-xs py-0.5"
              >
                <input
                  type="radio"
                  name="rating_opt"
                  checked={ratingFilter === r}
                  onChange={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                  className="accent-[#800020]"
                />
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-800">
                    {r}★ & above
                  </span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: r }).map((_, i) => (
                      <Star key={i} size={11} className="fill-amber-400" />
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 6. DISCOUNT ACCORDION */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("discount")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Special Offers & Discount</span>
          {expandedSections.discount ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.discount && (
          <div className="mt-3 space-y-1.5">
            {[30, 20, 10].map((d) => (
              <label
                key={d}
                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-[#800020] text-xs py-0.5"
              >
                <input
                  type="radio"
                  name="disc_opt"
                  checked={discountFilter === d}
                  onChange={() =>
                    setDiscountFilter(discountFilter === d ? 0 : d)
                  }
                  className="accent-[#800020]"
                />
                <span>{d}% or more</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 7. AVAILABILITY ACCORDION */}
      <div className="py-3.5">
        <div
          onClick={() => toggleSection("availability")}
          className="flex items-center justify-between cursor-pointer font-bold text-gray-800 uppercase tracking-wider text-[11px] select-none"
        >
          <span>Availability / Stock</span>
          {expandedSections.availability ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>

        {expandedSections.availability && (
          <div className="mt-3 space-y-1.5">
            {[
              { id: "All", label: "Include All Items" },
              { id: "inStock", label: "In Stock Only (Ready to Dispatch)" },
              { id: "soldOut", label: "Crafted on Request / Out of Stock" },
            ].map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-[#800020] text-xs py-0.5"
              >
                <input
                  type="radio"
                  name="avail_opt"
                  checked={stockFilter === opt.id}
                  onChange={() => setStockFilter(opt.id)}
                  className="accent-[#800020]"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-6 sm:py-8 md:py-12">
      <div className="max-w-[1400px] 2xl:max-w-[1700px] 3xl:max-w-[2100px] 4k:max-w-[2560px] mx-auto px-3.5 sm:px-6 md:px-8 2xl:px-12">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Catalog", to: "/shop" },
            {
              label:
                selectedCategory !== "All"
                  ? selectedCategory
                  : "All Collections",
            },
          ]}
        />


        {/* Page Banner & In-Page Search Bar */}
        <div className="my-6 bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#800020] font-bold block mb-1">
                Authentic Handloom Collection
              </span>
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-gray-900">
                {selectedCategory === "All"
                  ? "Explore All Handlooms & Ethnic Attire"
                  : selectedCategory}
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                Browse through genuine Silk Mark certified weaves, royal bridal collections, and heritage handloom attire.
              </p>
            </div>

            {/* In-page Prominent Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const p = new URLSearchParams(searchParams);
                if (searchQuery) p.set("search", searchQuery);
                else p.delete("search");
                setSearchParams(p);
              }}
              className="w-full md:w-96 flex items-center bg-[#FAF8F5] border border-gray-300 rounded-xs px-3 py-1.5 focus-within:border-[#800020] focus-within:bg-white transition-colors shadow-xs"
            >
              <Search size={16} className="text-gray-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saree name, weave, SKU, fabric..."
                className="w-full text-xs bg-transparent outline-none text-gray-800 placeholder:text-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    const p = new URLSearchParams(searchParams);
                    p.delete("search");
                    setSearchParams(p);
                  }}
                  className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Top Control Bar: Total Count, Sorting & Grid Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white border border-gray-200 rounded-sm p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-1.5 bg-[#800020] text-white text-xs font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Filter size={13} />
              <span>
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </span>
            </button>

            <span className="text-xs text-gray-600 font-medium">
              Showing <strong>{filteredProducts.length}</strong> authentic creations
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-semibold hidden sm:inline">
                Sort By:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs border border-gray-300 rounded-xs py-1.5 px-3 bg-white outline-none cursor-pointer focus:border-[#800020] font-medium text-gray-800"
              >
                <option value="featured">Featured / Curated</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Patron Rating</option>
                <option value="discount">Biggest Discount (%)</option>
              </select>
            </div>

            {/* Grid Toggle (3 vs 4 columns) */}
            <div className="hidden sm:flex items-center border border-gray-200 rounded-xs overflow-hidden bg-gray-50">
              <button
                onClick={() => setColumns(3)}
                className={`p-1.5 cursor-pointer transition-colors ${
                  columns === 3
                    ? "bg-[#800020] text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="3 Columns Grid"
              >
                <Grid3X3 size={15} />
              </button>
              <button
                onClick={() => setColumns(4)}
                className={`p-1.5 cursor-pointer transition-colors ${
                  columns === 4
                    ? "bg-[#800020] text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="4 Columns Grid"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid Layout: Flipkart Style Sidebar & Products Grid */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Flipkart-Style Desktop Filter Sidebar */}
          <aside className="hidden lg:block bg-white border border-gray-200 rounded-sm shadow-xs sticky top-24 overflow-hidden">
            {/* Header: Filters + Clear All */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-[#800020]" />
                <span>Filters</span>
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-[#800020] hover:underline cursor-pointer uppercase tracking-wider"
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            {/* Active Filter Chips inside Sidebar */}
            {activeFiltersCount > 0 && (
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-1.5">
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-xs text-[10.5px] font-semibold text-gray-800 shadow-xs">
                    {selectedCategory}
                    <X
                      size={11}
                      className="cursor-pointer hover:text-[#800020]"
                      onClick={() => handleCategoryClick("All")}
                    />
                  </span>
                )}
                {selectedSubcat !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-xs text-[10.5px] font-semibold text-gray-800 shadow-xs">
                    {selectedSubcat}
                    <X
                      size={11}
                      className="cursor-pointer hover:text-[#800020]"
                      onClick={() => handleSubcatClick("All")}
                    />
                  </span>
                )}
                {seasonFilter !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-xs text-[10.5px] font-semibold text-gray-800 shadow-xs">
                    {seasonFilter}
                    <X
                      size={11}
                      className="cursor-pointer hover:text-[#800020]"
                      onClick={() => setSeasonFilter("All")}
                    />
                  </span>
                )}
                {selectedBrands.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-xs text-[10.5px] font-semibold text-gray-800 shadow-xs"
                  >
                    {b}
                    <X
                      size={11}
                      className="cursor-pointer hover:text-[#800020]"
                      onClick={() => handleBrandToggle(b)}
                    />
                  </span>
                ))}
                {pricePreset !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-xs text-[10.5px] font-semibold text-gray-800 shadow-xs">
                    {pricePreset}
                    <X
                      size={11}
                      className="cursor-pointer hover:text-[#800020]"
                      onClick={() => setPricePreset("All")}
                    />
                  </span>
                )}
              </div>
            )}

            {/* Accordion Filter Sections */}
            <div className="p-4 max-h-[calc(100vh-220px)] overflow-y-auto no-scrollbar">
              {FilterContent}
            </div>
          </aside>

          {/* Products Grid Column */}
          <div className="space-y-4">
            {/* Top Subcategory Horizontal Quick-Pill Filter (Visible when a Category is chosen) */}
            {selectedCategory !== "All" && currentCategorySubcats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-sm p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Layers size={13} className="text-[#800020]" />
                    <span>Explore {selectedCategory} Subcategories / Weaves:</span>
                  </span>
                  <span className="text-[10.5px] text-gray-400 font-medium">
                    {currentCategorySubcats.length} varieties
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    type="button"
                    onClick={() => handleSubcatClick("All")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                      selectedSubcat === "All"
                        ? "bg-[#800020] text-white border-[#800020] shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <span>All {selectedCategory}</span>
                    <span className={`text-[10px] ${selectedSubcat === "All" ? "text-white/80" : "text-gray-400"}`}>
                      ({currentCategoryTotalCount})
                    </span>
                  </button>

                  {currentCategorySubcats.map((sub) => {
                    const subCount = subcategoryCounts[sub.id] || subcategoryCounts[sub.name.toLowerCase()] || 0;
                    const isSubSelected = selectedSubcat.toLowerCase() === sub.name.toLowerCase();
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubcatClick(sub.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isSubSelected
                            ? "bg-[#800020] text-white border-[#800020] shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className={`text-[10px] ${isSubSelected ? "text-white/80" : "text-gray-400"}`}>
                          ({subCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isProductsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4] bg-gray-200 animate-pulse rounded-sm"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-sm p-12 text-center shadow-xs">
                <EmptyState
                  title="No Handloom Creations Found"
                  description="Try adjusting your filter criteria or search query to find more masterpieces."
                  actionLabel="Reset All Filters"
                  onAction={resetAllFilters}
                />
              </div>
            ) : (
              <div
                className={`grid gap-3.5 sm:gap-4 md:gap-6 ${
                  columns === 3
                    ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-6"
                }`}
              >
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

            )}
          </div>
        </div>
      </div>

      {/* Mobile Flipkart-Style Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </h3>
              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs font-bold text-[#800020] uppercase"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-900"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-4 flex-1 overflow-y-auto">{FilterContent}</div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters ({filteredProducts.length} Results)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

