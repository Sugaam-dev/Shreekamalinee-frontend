import { useState, useMemo, Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  ChevronLeft,
  Boxes,
  Sparkles,
} from "lucide-react";
import { variantSchema } from "../../schemas/productSchemas.js";
import {
  useProductsQuery,
  useUpdateVariantStockMutation,
  useAddVariantMutation,
  useDeleteVariantMutation,
} from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

const ITEMS_PER_PAGE = 15;

export default function AdminInventoryPage() {
  const { showToast } = useCart();

  const { data: products = [], isLoading: isProductsLoading } = useProductsQuery();
  const { data: categories = [] } = useCategoriesQuery();

  const updateStockMutation = useUpdateVariantStockMutation();
  const addVariantMutation = useAddVariantMutation();
  const deleteVariantMutation = useDeleteVariantMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [stockHealthFilter, setStockHealthFilter] = useState("all"); // 'all' | 'low' | 'out' | 'in'
  const [currentPage, setCurrentPage] = useState(1);

  // Accordion state: Set of expanded product IDs
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Primary parent categories
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  // Subcategories belonging to selected parent category
  const availableSubcategories = useMemo(() => {
    if (selectedParentCategory === "all") return [];
    return categories.filter((c) => c.parentId === selectedParentCategory);
  }, [categories, selectedParentCategory]);

  // Metrics
  const metrics = useMemo(() => {
    let totalSkus = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const variants = p.variants || [];
      variants.forEach((v) => {
        totalSkus++;
        const qty = Number(v.stockQuantity) || 0;
        totalUnits += qty;
        if (qty === 0) outOfStockCount++;
        else if (qty <= 3) lowStockCount++;
      });
    });

    return { totalProducts: products.length, totalSkus, totalUnits, lowStockCount, outOfStockCount };
  }, [products]);

  const toggleExpand = (productId) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedProductIds.size === products.length) {
      setExpandedProductIds(new Set());
    } else {
      setExpandedProductIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleParentCategoryChange = (e) => {
    setSelectedParentCategory(e.target.value);
    setSelectedSubcategory("all");
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const variants = product.variants || [];
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        variants.some(
          (v) =>
            v.sku?.toLowerCase().includes(term) ||
            v.color?.toLowerCase().includes(term) ||
            v.size?.toLowerCase().includes(term)
        );

      // Hierarchical Category Filtering
      let matchesCategory = true;
      if (selectedSubcategory !== "all") {
        matchesCategory = product.categoryId === selectedSubcategory;
      } else if (selectedParentCategory !== "all") {
        const subIds = new Set(
          categories.filter((c) => c.parentId === selectedParentCategory).map((c) => c.id)
        );
        subIds.add(selectedParentCategory);
        matchesCategory =
          subIds.has(product.categoryId) ||
          product.parentCategoryId === selectedParentCategory ||
          product.categoryId === selectedParentCategory;
      }

      const hasOutOfStock = variants.some((v) => (Number(v.stockQuantity) || 0) === 0);
      const hasLowStock = variants.some(
        (v) => (Number(v.stockQuantity) || 0) > 0 && (Number(v.stockQuantity) || 0) <= 3
      );
      const isWellStocked =
        variants.length > 0 && variants.every((v) => (Number(v.stockQuantity) || 0) > 3);

      let matchesStock = true;
      if (stockHealthFilter === "out") matchesStock = hasOutOfStock || (!product.inStock && variants.length === 0);
      else if (stockHealthFilter === "low") matchesStock = hasLowStock;
      else if (stockHealthFilter === "in") matchesStock = isWellStocked && product.inStock;

      return matchesSearch && matchesCategory && matchesStock;
    });

    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [
    products,
    searchTerm,
    selectedParentCategory,
    selectedSubcategory,
    categories,
    stockHealthFilter,
  ]);

  const handleStockDirectSet = async (variantId, newStock) => {
    try {
      await updateStockMutation.mutateAsync({ variantId, stock: Math.max(0, newStock) });
      showToast(`Stock updated to ${newStock} units`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "warning");
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handleStockAdjust = async (e, variantId, currentStock, delta) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newStock = Math.max(0, currentStock + delta);
    try {
      await updateStockMutation.mutateAsync({ variantId, stock: newStock });
      showToast(`Stock adjusted to ${newStock} units`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "warning");
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(variantSchema),
  });

  const handleOpenAddModal = (productId = null) => {
    if (products.length === 0) {
      showToast("Please create a product first before adding inventory variants", "warning");
      return;
    }
    const targetId = productId || selectedProductId || products[0]?.id || "";
    setSelectedProductId(targetId);
    reset({
      size: "Free Size",
      color: "New Color",
      stockQuantity: 5,
      sku: `SK-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsAddModalOpen(true);
  };

  const onAddVariantSubmit = async (data) => {
    if (!selectedProductId) {
      showToast("Please select a target product", "warning");
      return;
    }
    try {
      await addVariantMutation.mutateAsync({
        productId: selectedProductId,
        variantData: data,
      });
      showToast("Variant SKU added successfully!", "success");
      setExpandedProductIds((prev) => new Set([...prev, selectedProductId]));
      setIsAddModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add variant SKU", "warning");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVariantMutation.mutateAsync(deleteTarget.id);
      showToast(`Variant "${deleteTarget.sku}" deleted successfully`, "info");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete variant", "warning");
    }
  };

  return (
    <AdminLayout
      title="Inventory & Stock Management"
      subtitle="Organized product hierarchy with interactive variant drawers, real-time stock counters, and SKU tracking"
    >
      <div className="space-y-6">
        {/* KPI Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Products & SKUs
              </span>
              <div className="w-8 h-8 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020]">
                <Boxes size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {metrics.totalProducts}{" "}
              <span className="text-xs font-sans font-medium text-gray-500">
                ({metrics.totalSkus} SKUs)
              </span>
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Catalog coverage</span>
          </div>

          <div className="bg-white p-4 rounded-sm border border-emerald-100 bg-emerald-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Total Available Units
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {metrics.totalUnits}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
              Ready for immediate dispatch
            </span>
          </div>

          <div className="bg-white p-4 rounded-sm border border-amber-200 bg-amber-50/40 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Low Stock (≤3 Units)
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-amber-900 mt-2">
              {metrics.lowStockCount}
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-0.5 block">
              Restock recommendation
            </span>
          </div>

          <div className="bg-white p-4 rounded-sm border border-rose-200 bg-rose-50/40 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                Out of Stock (0 Units)
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-rose-900 mt-2">
              {metrics.outOfStockCount}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              Unavailable for purchase
            </span>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Omni-Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by SKU, Product Name, Color, or Size..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 bg-white font-medium transition-all"
              />
            </div>

            {/* 1. Primary Category Filter */}
            <select
              value={selectedParentCategory}
              onChange={handleParentCategoryChange}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium transition-all cursor-pointer max-w-[170px]"
            >
              <option value="all">All Categories ({parentCategories.length})</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* 2. Dependent Subcategory Filter */}
            <select
              value={selectedSubcategory}
              disabled={selectedParentCategory === "all" || availableSubcategories.length === 0}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs border rounded-xs outline-none focus:border-[#800020] bg-white font-medium transition-all max-w-[170px] ${
                selectedParentCategory === "all" || availableSubcategories.length === 0
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "border-gray-300 cursor-pointer"
              }`}
            >
              <option value="all">
                {selectedParentCategory === "all"
                  ? "Select Category First"
                  : availableSubcategories.length === 0
                  ? "No Subcategories"
                  : `All Subcategories (${availableSubcategories.length})`}
              </option>
              {availableSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            {/* Stock Health Tabs */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStockHealthFilter("all")}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  stockHealthFilter === "all"
                    ? "bg-[#800020] text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setStockHealthFilter("low")}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  stockHealthFilter === "low"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-amber-800 hover:bg-amber-100/60"
                }`}
              >
                Low Stock ({metrics.lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockHealthFilter("out")}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  stockHealthFilter === "out"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-rose-700 hover:bg-rose-100/60"
                }`}
              >
                Out of Stock ({metrics.outOfStockCount})
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleExpandAll}
              className="px-3.5 py-2 text-xs border border-gray-300 rounded-xs hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              {expandedProductIds.size === products.length ? "Collapse All Drawers" : "Expand All Drawers"}
            </button>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenAddModal()}
              className="cursor-pointer shadow-2xs"
            >
              Add Variant SKU
            </Button>
          </div>
        </div>

        {/* Clean Standard Table (1 Single TBODY with Fragments) */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[260px]">Product & Master SKU</th>
                  <th className="py-3 px-3 w-36">Category</th>
                  <th className="py-3 px-3 w-36">Variant SKUs</th>
                  <th className="py-3 px-3 w-28">Total Stock</th>
                  <th className="py-3 px-3 w-32">Stock Health</th>
                  <th className="py-3 px-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {isProductsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Boxes size={24} className="animate-pulse text-gray-300" />
                        <span>Loading warehouse inventory records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-1.5">
                        <Package size={28} className="text-gray-300 mx-auto" />
                        <span className="font-semibold text-gray-600">No matching products found</span>
                        <span className="text-[11px] text-gray-400">
                          Try adjusting your search keywords or stock filters.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const isExpanded = expandedProductIds.has(product.id);
                    const variants = product.variants || [];
                    const productTotalStock = variants.reduce(
                      (sum, v) => sum + (Number(v.stockQuantity) || 0),
                      0
                    );
                    const productImg =
                      product.imageUrls?.[0] || product.images?.[0] || product.image || "";

                    return (
                      <Fragment key={product.id}>
                        {/* Parent Product Master Row */}
                        <tr
                          className={`transition-colors cursor-pointer group ${
                            isExpanded ? "bg-amber-50/40" : "hover:bg-gray-50/70"
                          }`}
                          onClick={() => toggleExpand(product.id)}
                        >
                          {/* Chevron Icon Trigger */}
                          <td className="py-3 px-3 text-center">
                            <div
                              className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition-all ${
                                isExpanded
                                  ? "bg-[#800020] text-white shadow-2xs"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-[#800020]/10 group-hover:text-[#800020]"
                              }`}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </div>
                          </td>

                          {/* Product Visual, Title & Master SKU */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-13 min-w-[44px] rounded-xs border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 shadow-2xs">
                                {productImg ? (
                                  <img
                                    src={productImg}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <ImageIcon size={16} className="text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-serif font-bold text-sm text-gray-900 group-hover:text-[#800020] transition-colors truncate max-w-[240px]">
                                  {product.name}
                                </div>
                                <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-xs">
                                    {product.sku}
                                  </span>
                                  <span>•</span>
                                  <span className="text-gray-600 truncate">{product.brand}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 rounded-xs text-[11px] font-medium truncate max-w-[130px]">
                              <Layers size={11} className="text-gray-500 shrink-0" />
                              <span className="truncate">{product.categoryName || "Catalog"}</span>
                            </span>
                          </td>

                          {/* PROMINENT CLICKABLE VARIANT BADGE BUTTON */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(product.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                isExpanded
                                  ? "bg-[#800020] text-white ring-2 ring-[#800020]/20"
                                  : "bg-amber-50 hover:bg-amber-100 text-[#800020] border border-amber-300"
                              }`}
                              title="Click to expand/collapse variant SKUs"
                            >
                              <Package size={12} />
                              <span>
                                {variants.length} {variants.length === 1 ? "Variant" : "Variants"}
                              </span>
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                          </td>

                          {/* Total Stock */}
                          <td className="py-3 px-3">
                            <div className="font-serif font-bold text-sm text-gray-900">
                              {productTotalStock}{" "}
                              <span className="text-xs font-sans font-normal text-gray-500">Units</span>
                            </div>
                          </td>

                          {/* Stock Health */}
                          <td className="py-3 px-3">
                            {productTotalStock === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-full font-bold">
                                <AlertCircle size={11} />
                                <span>Out of Stock</span>
                              </span>
                            ) : productTotalStock <= 3 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-full font-bold">
                                <AlertTriangle size={11} />
                                <span>Low Stock ({productTotalStock})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-full font-bold">
                                <CheckCircle2 size={11} />
                                <span>In Stock</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenAddModal(product.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#800020] bg-white border border-[#800020]/30 hover:bg-[#800020] hover:text-white rounded-xs font-semibold cursor-pointer transition-all shadow-2xs"
                              title="Add SKU variant to this product"
                            >
                              <Plus size={12} />
                              <span>Add Variant</span>
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Child Variants Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#FAF8F5]">
                            <td colSpan={7} className="p-0 border-t border-b border-gray-200">
                              <div className="py-3 px-6 pl-12 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <Sparkles size={13} className="text-[#800020]" />
                                    <span>
                                      Specific Color & Size Variants for:{" "}
                                      <strong className="text-[#800020]">{product.name}</strong>
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddModal(product.id)}
                                    className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus size={12} />
                                    <span>+ Add New Variant SKU</span>
                                  </button>
                                </div>

                                {variants.length === 0 ? (
                                  <div className="p-4 text-center bg-white border border-gray-200 rounded-xs text-gray-400 text-xs italic">
                                    No variants defined yet for this product. Click "+ Add New Variant
                                    SKU" above to create one.
                                  </div>
                                ) : (
                                  <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-2xs">
                                    <table className="w-full text-xs text-left">
                                      <thead>
                                        <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                                          <th className="py-2 px-3">Variant SKU Code</th>
                                          <th className="py-2 px-3">Size / Dimensions</th>
                                          <th className="py-2 px-3">Color Shade</th>
                                          <th className="py-2 px-3">Stock Units</th>
                                          <th className="py-2 px-3 text-center">
                                            Quick Adjust (+ / -)
                                          </th>
                                          <th className="py-2 px-3 text-right">Delete</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 font-medium">
                                        {variants.map((v) => (
                                          <tr key={v.id} className="hover:bg-amber-50/20 transition-colors">
                                            {/* SKU */}
                                            <td className="py-2 px-3">
                                              <span className="font-mono font-bold text-[11px] text-gray-900 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-xs">
                                                {v.sku}
                                              </span>
                                            </td>

                                            {/* Size */}
                                            <td className="py-2 px-3 font-semibold text-gray-800">
                                              {v.size || "Free Size"}
                                            </td>

                                            {/* Color */}
                                            <td className="py-2 px-3 text-gray-700">
                                              <span className="inline-flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-[#800020]/40" />
                                                <span>{v.color || "Standard"}</span>
                                              </span>
                                            </td>

                                            {/* Stock Status */}
                                            <td className="py-2 px-3">
                                              <span
                                                className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                                  (Number(v.stockQuantity) || 0) === 0
                                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                    : (Number(v.stockQuantity) || 0) <= 3
                                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                }`}
                                              >
                                                {v.stockQuantity} Units
                                              </span>
                                            </td>

                                            {/* Direct Typeable Stock Input + Quick Adjust Steppers */}
                                            <td className="py-2 px-3 text-center">
                                              <div className="inline-flex items-center gap-1 bg-gray-50 p-1 rounded-xs border border-gray-200 shadow-2xs">
                                                <button
                                                  type="button"
                                                  disabled={
                                                    (Number(v.stockQuantity) || 0) <= 0 ||
                                                    updateStockMutation.isPending
                                                  }
                                                  onClick={(e) =>
                                                    handleStockAdjust(e, v.id, Number(v.stockQuantity) || 0, -1)
                                                  }
                                                  className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer transition-colors"
                                                  title="Decrease stock by 1"
                                                >
                                                  <MinusCircle size={14} />
                                                </button>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  defaultValue={v.stockQuantity ?? 0}
                                                  key={v.stockQuantity}
                                                  onBlur={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val) && val >= 0 && val !== v.stockQuantity) {
                                                      handleStockDirectSet(v.id, val);
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                      e.target.blur();
                                                    }
                                                  }}
                                                  className="w-12 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-xs py-0.5 outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                                                  title="Click or type exact stock number and press Enter or click outside to save"
                                                />
                                                <button
                                                  type="button"
                                                  disabled={updateStockMutation.isPending}
                                                  onClick={(e) =>
                                                    handleStockAdjust(e, v.id, Number(v.stockQuantity) || 0, 1)
                                                  }
                                                  className="p-1 text-gray-400 hover:text-emerald-700 disabled:opacity-20 cursor-pointer transition-colors"
                                                  title="Increase stock by 1"
                                                >
                                                  <PlusCircle size={14} />
                                                </button>
                                              </div>
                                            </td>

                                            {/* Delete */}
                                            <td className="py-2 px-3 text-right">
                                              <button
                                                type="button"
                                                onClick={() => setDeleteTarget(v)}
                                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer transition-colors"
                                                title="Delete Variant SKU"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-gray-500">
                Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
                {filteredProducts.length} Products)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                  className="cursor-pointer"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`w-7 h-7 rounded-xs font-semibold text-xs cursor-pointer transition-all ${
                        currentPage === num
                          ? "bg-[#800020] text-white shadow-2xs"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  icon={ChevronRight}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Add Variant Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Variant SKU"
          size="md"
        >
          <form onSubmit={handleSubmit(onAddVariantSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Target Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Size / Dimensions *
                </label>
                <input
                  type="text"
                  {...register("size")}
                  placeholder="e.g. Free Size, S, M, L, XL"
                  className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.size ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                  }`}
                />
                {errors.size && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.size.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Color Shade *
                </label>
                <input
                  type="text"
                  {...register("color")}
                  placeholder="e.g. Crimson Red, Emerald Green"
                  className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.color ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                  }`}
                />
                {errors.color && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.color.message}</span>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Initial Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("stockQuantity")}
                  className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errors.stockQuantity ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                  }`}
                />
                {errors.stockQuantity && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.stockQuantity.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Variant SKU *
                </label>
                <input
                  type="text"
                  {...register("sku")}
                  placeholder="e.g. SK-RED-FS-01"
                  className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                    errors.sku ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                  }`}
                />
                {errors.sku && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.sku.message}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={addVariantMutation.isPending}
              >
                Add Variant SKU
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Variant SKU"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs">
              <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              <span>
                Are you sure you want to delete SKU <strong>{deleteTarget?.sku}</strong> ({deleteTarget?.color})?
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={deleteVariantMutation.isPending}
                onClick={handleConfirmDelete}
              >
                Delete Variant
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
