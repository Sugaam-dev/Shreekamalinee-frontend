import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Sparkles,
  Users,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { couponSchema } from "../../schemas/couponSchemas.js";
import {
  useCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useCouponUsagesQuery,
} from "../../queries/useCouponQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { TableRowSkeleton } from "../../components/common/Skeleton.jsx";

export default function AdminCouponsPage() {
  const { showToast } = useCart();

  const { data: coupons = [], isLoading: isCouponsLoading } = useCouponsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: dbProducts = [] } = useProductsQuery();

  const createCouponMutation = useCreateCouponMutation();
  const deleteCouponMutation = useDeleteCouponMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'expired'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedCouponForUsages, setSelectedCouponForUsages] = useState(null);

  const { data: couponUsagesList = [], isLoading: isUsagesLoading } = useCouponUsagesQuery(selectedCouponForUsages?.id);

  // Hierarchy Selection State (Categories, Subcategories & Products)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [scopeSearch, setScopeSearch] = useState("");

  // VIP email tags
  const [emailTags, setEmailTags] = useState([]);
  const [emailInput, setEmailInput] = useState("");


  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minPurchaseAmount: 0,
      maxDiscountAmount: 1000,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      active: true,
      applicableCategoryIds: [],
    },

  });

  const isSavingCoupon = createCouponMutation.isPending || isSubmitting;

  const watchedDiscountType = watch("discountType");

  const handleAddEmail = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const trimmed = emailInput.trim().toLowerCase();
      if (trimmed && !emailTags.includes(trimmed)) {
        setEmailTags([...emailTags, trimmed]);
        setEmailInput("");
      }
    }
  };

  const handleRemoveEmail = (tag) => {
    setEmailTags(emailTags.filter((e) => e !== tag));
  };

  // Build 3-Tier Hierarchy: Parent Categories -> Subcategories -> Products
  const categoryTree = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    const rootCats = categories.filter((c) => !c.parentId && !c.parentCategoryId);

    return rootCats.map((root) => {
      const subcats = categories.filter(
        (c) => (c.parentId === root.id || c.parentCategoryId === root.id) && c.id !== root.id
      );

      const subcategoriesWithProducts = subcats.map((sub) => {
        const products = (dbProducts || []).filter(
          (p) => p.categoryId === sub.id || p.subcategoryId === sub.id
        );
        return {
          ...sub,
          products,
        };
      });

      const subcatIds = new Set(subcats.map((s) => s.id));
      const directProducts = (dbProducts || []).filter(
        (p) => p.categoryId === root.id && (!p.subcategoryId || !subcatIds.has(p.subcategoryId))
      );

      const totalProductsCount =
        directProducts.length +
        subcategoriesWithProducts.reduce((sum, s) => sum + s.products.length, 0);

      return {
        ...root,
        subcategories: subcategoriesWithProducts,
        directProducts,
        totalProductsCount,
      };
    });
  }, [categories, dbProducts]);

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategorySelection = (catId, childSubcatIds = []) => {
    setSelectedCategoryIds((prev) => {
      const isSelected = prev.includes(catId);
      if (isSelected) {
        return prev.filter((id) => id !== catId && !childSubcatIds.includes(id));
      } else {
        return [...prev, catId];
      }
    });
  };

  const toggleSubcategorySelection = (subcatId) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(subcatId)) {
        return prev.filter((id) => id !== subcatId);
      } else {
        return [...prev, subcatId];
      }
    });
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const clearAllScopeSelections = () => {
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
  };

  const handleOpenCreateModal = () => {
    setEmailTags([]);
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
    setExpandedNodes(new Set());
    setScopeSearch("");
    reset({
      code: `FESTIVE${Math.floor(10 + Math.random() * 90)}`,
      discountType: "PERCENTAGE",
      discountValue: 15,
      minPurchaseAmount: 0,
      maxDiscountAmount: 1500,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      active: true,
      applicableCategoryIds: [],
    });

    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const minVal = Number(data.minPurchaseAmount || data.minOrderAmount || 0);
      const maxVal = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null;
      const payload = {
        code: data.code.trim().toUpperCase(),
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        minOrderAmount: minVal,
        minPurchaseAmount: minVal,
        maxDiscountAmount: maxVal,
        expiryDate: new Date(data.expiryDate).toISOString(),
        isActive: Boolean(data.active),
        active: Boolean(data.active),
        applicableCategoryIds: selectedCategoryIds,
        applicableProductIds: selectedProductIds,
        applicableUserEmails: emailTags,
      };

      await createCouponMutation.mutateAsync(payload);
      showToast("Coupon voucher created successfully!", "success");
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create coupon", "warning");
    }
  };


  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCouponMutation.mutateAsync(deleteTarget.id);
      showToast(`Coupon "${deleteTarget.code}" removed`, "info");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete coupon", "warning");
    }
  };

  const now = new Date();
  const safeCoupons = useMemo(() => {
    if (Array.isArray(coupons)) return coupons;
    if (Array.isArray(coupons?.content)) return coupons.content;
    if (Array.isArray(coupons?.data)) return coupons.data;
    return [];
  }, [coupons]);

  // Filter and sort coupons (Latest on Top)
  const filteredCoupons = useMemo(() => {
    return safeCoupons
      .filter((c) => {
        const matchesSearch = (c.code || "").toLowerCase().includes(searchTerm.toLowerCase());
        const isExpired = c.expiryDate && new Date(c.expiryDate) < now;

        if (statusFilter === "active") return matchesSearch && c.active && !isExpired;
        if (statusFilter === "expired") return matchesSearch && (isExpired || !c.active);
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt || b.expiryDate || 0).getTime() - new Date(a.createdAt || a.expiryDate || 0).getTime());
  }, [safeCoupons, searchTerm, statusFilter]);


  return (
    <AdminLayout
      title="Coupons & Discount Vouchers"
      subtitle="Create percentage discounts, flat cashback codes, category-specific vouchers, and VIP patron coupons"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by coupon code..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xs outline-none focus:border-[#800020] bg-white font-medium font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "all" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({safeCoupons.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "active" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("expired")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "expired" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Expired / Inactive
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="shrink-0 cursor-pointer"
          >
            Create Coupon
          </Button>
        </div>

        {/* Coupons Table */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Criteria & Caps</th>
                  <th className="py-3.5 px-4">Category / VIP Scope</th>
                  <th className="py-3.5 px-4">Redemptions</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isCouponsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No discount vouchers found.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < now;
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Code */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-sm text-[#800020] bg-[#800020]/5 px-2.5 py-1 rounded-xs border border-[#800020]/20">
                            {coupon.code}
                          </span>
                        </td>

                        {/* Discount */}
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${coupon.discountValue}% OFF`
                            : `FLAT ${formatCurrency(coupon.discountValue)} OFF`}
                        </td>

                        {/* Criteria */}
                        <td className="py-3 px-4 text-gray-600">
                          <div>
                            Min Spend:{" "}
                            <span className="font-semibold text-gray-900">
                              {(Number(coupon.minOrderAmount || coupon.minPurchaseAmount) || 0) > 0
                                ? formatCurrency(coupon.minOrderAmount || coupon.minPurchaseAmount)
                                : "No Minimum"}
                            </span>
                          </div>
                          <div>
                            Max Discount:{" "}
                            <span className="font-semibold text-gray-900">
                              {(Number(coupon.maxDiscountAmount) || 0) > 0
                                ? formatCurrency(coupon.maxDiscountAmount)
                                : "No Limit"}
                            </span>
                          </div>
                        </td>

                        {/* Scope */}
                        <td className="py-3 px-4">
                          {coupon.applicableCategoryNames && coupon.applicableCategoryNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {coupon.applicableCategoryNames.map((name) => (
                                <span
                                  key={name}
                                  className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-xs text-[10.5px]"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              All Products & Weaves
                            </span>
                          )}
                          {coupon.applicableUserEmails && coupon.applicableUserEmails.length > 0 && (
                            <div className="text-[10px] text-purple-700 mt-1 font-semibold">
                              Exclusive to {coupon.applicableUserEmails.length} VIP Users
                            </div>
                          )}
                        </td>

                        {/* Redemptions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{coupon.timesUsed || 0}</span>
                            <span className="text-gray-500 text-[11px]">
                              {coupon.timesUsed === 1 ? "redemption" : "redemptions"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCouponForUsages(coupon)}
                            className="inline-flex items-center gap-1 mt-1 text-[10.5px] font-bold text-[#800020] hover:underline cursor-pointer"
                          >
                            <Users size={11} />
                            <span>View User History</span>
                          </button>
                        </td>

                        {/* Validity Status */}
                        <td className="py-3 px-4">
                          {isExpired || !coupon.active ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold">
                              <AlertCircle size={12} />
                              <span>Expired</span>
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                                <CheckCircle2 size={12} />
                                <span>Active</span>
                              </span>
                              <div className="text-[10.5px] text-gray-400 mt-0.5">
                                Until {formatDate(coupon.expiryDate)}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(coupon)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Coupon Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Discount Voucher"
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  {...register("code")}
                  placeholder="e.g. FESTIVE20"
                  className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono uppercase font-bold ${
                    errors.code ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                  }`}
                />
                {errors.code && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.code.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Discount Type *
                </label>
                <select
                  {...register("discountType")}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                >
                  <option value="PERCENTAGE">Percentage (% Off)</option>
                  <option value="FIXED">Fixed Flat Amount (₹ Off)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  {watchedDiscountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Flat Discount (₹) *"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("discountValue")}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Min Purchase (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("minPurchaseAmount")}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Max Discount Cap (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("maxDiscountAmount")}
                  placeholder="Optional cap"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Expiry Date & Time *
              </label>
              <input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                {...register("expiryDate")}
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.expiryDate ? "border-rose-500 focus:border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errors.expiryDate && (
                <span className="text-[10.5px] text-rose-600 block mt-1">
                  {errors.expiryDate.message}
                </span>
              )}
            </div>


            {/* Hierarchical Scope Selector: Category -> Subcategory -> Product */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-gray-900">
                    Applicable Target Scope
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Select whole categories, subcategories, or individual products. Leave empty for storewide coupon.
                  </p>
                </div>

                {/* Scope status badges */}
                <div className="flex items-center gap-2">
                  {selectedCategoryIds.length === 0 && selectedProductIds.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                      <Sparkles size={12} />
                      <span>Storewide (All Products)</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {selectedCategoryIds.length > 0 && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-xs">
                          {selectedCategoryIds.length} Cat / Subcat
                        </span>
                      )}
                      {selectedProductIds.length > 0 && (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-xs">
                          {selectedProductIds.length} Products
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={clearAllScopeSelections}
                        className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer ml-1"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scope Hierarchy Card with Search */}
              <div className="border border-gray-300 rounded-sm overflow-hidden bg-white shadow-xs">
                {/* Search Bar */}
                <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={scopeSearch}
                    onChange={(e) => setScopeSearch(e.target.value)}
                    placeholder="Search category, subcategory, or product name..."
                    className="w-full text-xs bg-transparent outline-none text-gray-800 placeholder:text-gray-400 font-medium"
                  />
                  {scopeSearch && (
                    <button
                      type="button"
                      onClick={() => setScopeSearch("")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Tree View List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 p-1">
                  {categoryTree.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400 italic">
                      No categories found in database.
                    </div>
                  ) : (
                    categoryTree.map((root) => {
                      const rootMatchesSearch =
                        !scopeSearch ||
                        root.name.toLowerCase().includes(scopeSearch.toLowerCase());
                      const matchingSubcats = root.subcategories.filter(
                        (sub) =>
                          !scopeSearch ||
                          sub.name.toLowerCase().includes(scopeSearch.toLowerCase()) ||
                          sub.products.some((p) =>
                            p.name.toLowerCase().includes(scopeSearch.toLowerCase())
                          )
                      );
                      const matchingDirectProducts = root.directProducts.filter(
                        (p) =>
                          !scopeSearch ||
                          p.name.toLowerCase().includes(scopeSearch.toLowerCase())
                      );

                      if (!rootMatchesSearch && matchingSubcats.length === 0 && matchingDirectProducts.length === 0) {
                        return null;
                      }

                      const isRootExpanded = expandedNodes.has(root.id) || Boolean(scopeSearch);
                      const isRootSelected = selectedCategoryIds.includes(root.id);
                      const allSubcatIds = root.subcategories.map((s) => s.id);

                      return (
                        <div key={root.id} className="py-1">
                          {/* 1. Root Category Row */}
                          <div className="flex items-center justify-between p-1.5 hover:bg-cream-2/40 rounded-xs transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleExpand(root.id)}
                                className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer rounded-xs"
                              >
                                {isRootExpanded ? (
                                  <ChevronDown size={15} />
                                ) : (
                                  <ChevronRight size={15} />
                                )}
                              </button>

                              <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isRootSelected}
                                  onChange={() => toggleCategorySelection(root.id, allSubcatIds)}
                                  className="w-4 h-4 rounded-xs text-[#800020] accent-[#800020] cursor-pointer"
                                />
                                {isRootExpanded ? (
                                  <FolderOpen size={16} className="text-amber-600 shrink-0" />
                                ) : (
                                  <Folder size={16} className="text-amber-600 shrink-0" />
                                )}
                                <span className="font-bold text-xs text-gray-900 truncate">
                                  {root.name}
                                </span>
                              </label>
                            </div>

                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                              {root.totalProductsCount} items
                            </span>
                          </div>

                          {/* 2. Subcategories & Direct Products Section */}
                          {isRootExpanded && (
                            <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-amber-200/60 ml-4 mt-0.5">
                              {/* Subcategories */}
                              {matchingSubcats.map((sub) => {
                                const isSubExpanded = expandedNodes.has(sub.id) || Boolean(scopeSearch);
                                const isSubSelected = selectedCategoryIds.includes(sub.id);
                                const matchingProducts = sub.products.filter(
                                  (p) =>
                                    !scopeSearch ||
                                    p.name.toLowerCase().includes(scopeSearch.toLowerCase())
                                );

                                return (
                                  <div key={sub.id} className="py-0.5">
                                    {/* Subcategory Row */}
                                    <div className="flex items-center justify-between p-1 hover:bg-gray-50 rounded-xs transition-colors">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {sub.products.length > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleExpand(sub.id)}
                                            className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                                          >
                                            {isSubExpanded ? (
                                              <ChevronDown size={13} />
                                            ) : (
                                              <ChevronRight size={13} />
                                            )}
                                          </button>
                                        ) : (
                                          <span className="w-4.5" />
                                        )}

                                        <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={isSubSelected || isRootSelected}
                                            disabled={isRootSelected}
                                            onChange={() => toggleSubcategorySelection(sub.id)}
                                            className="w-3.5 h-3.5 rounded-xs text-[#800020] accent-[#800020] cursor-pointer disabled:opacity-60"
                                          />
                                          <span className="text-xs font-semibold text-gray-800 truncate">
                                            {sub.name}
                                          </span>
                                        </label>
                                      </div>

                                      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-xs shrink-0">
                                        {sub.products.length} products
                                      </span>
                                    </div>

                                    {/* 3. Products under this Subcategory */}
                                    {isSubExpanded && matchingProducts.length > 0 && (
                                      <div className="pl-6 py-1 space-y-1 border-l border-gray-200 ml-3.5 mt-0.5">
                                        {matchingProducts.map((prod) => {
                                          const isProdSelected = selectedProductIds.includes(prod.id);
                                          const isCoveredByParent = isRootSelected || isSubSelected;

                                          return (
                                            <div
                                              key={prod.id}
                                              className="flex items-center justify-between p-1 hover:bg-gray-50 rounded-xs text-xs"
                                            >
                                              <label className="flex items-center gap-2 cursor-pointer select-none min-w-0 flex-1">
                                                <input
                                                  type="checkbox"
                                                  checked={isProdSelected || isCoveredByParent}
                                                  disabled={isCoveredByParent}
                                                  onChange={() => toggleProductSelection(prod.id)}
                                                  className="w-3.5 h-3.5 rounded-xs text-[#800020] accent-[#800020] cursor-pointer disabled:opacity-60"
                                                />
                                                <img
                                                  src={prod.image || (Array.isArray(prod.imageUrls) && prod.imageUrls[0]) || "/images/placeholder-saree.jpg"}
                                                  alt={prod.name}
                                                  className="w-5 h-6 object-cover rounded-xs border border-gray-200 shrink-0"
                                                />
                                                <span className="text-[11.5px] text-gray-700 truncate">
                                                  {prod.name}
                                                </span>
                                              </label>
                                              <span className="text-[11px] font-bold text-gray-900 shrink-0 ml-2">
                                                {formatCurrency(prod.price || prod.offerPrice || 0)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Direct Products attached to Root Category */}
                              {matchingDirectProducts.map((prod) => {
                                const isProdSelected = selectedProductIds.includes(prod.id);
                                const isCoveredByParent = isRootSelected;

                                return (
                                  <div
                                    key={prod.id}
                                    className="flex items-center justify-between p-1 hover:bg-gray-50 rounded-xs text-xs"
                                  >
                                    <label className="flex items-center gap-2 cursor-pointer select-none min-w-0 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isProdSelected || isCoveredByParent}
                                        disabled={isCoveredByParent}
                                        onChange={() => toggleProductSelection(prod.id)}
                                        className="w-3.5 h-3.5 rounded-xs text-[#800020] accent-[#800020] cursor-pointer disabled:opacity-60"
                                      />
                                      <img
                                        src={prod.image || (Array.isArray(prod.imageUrls) && prod.imageUrls[0]) || "/images/placeholder-saree.jpg"}
                                        alt={prod.name}
                                        className="w-5 h-6 object-cover rounded-xs border border-gray-200 shrink-0"
                                      />
                                      <span className="text-[11.5px] text-gray-700 truncate">
                                        {prod.name}
                                      </span>
                                    </label>
                                    <span className="text-[11px] font-bold text-gray-900 shrink-0 ml-2">
                                      {formatCurrency(prod.price || prod.offerPrice || 0)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>


            {/* Exclusive VIP Emails */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Exclusive VIP Emails (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                  placeholder="e.g. patron@gmail.com"
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddEmail}>
                  Add VIP
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[30px] p-2 bg-gray-50 border border-gray-200 rounded-xs">
                {emailTags.length === 0 ? (
                  <span className="text-gray-400 text-[11px] italic">Public coupon (all users eligible)</span>
                ) : (
                  emailTags.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-xs text-[11px]"
                    >
                      <span>{email}</span>
                      <button type="button" onClick={() => handleRemoveEmail(email)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSavingCoupon}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSavingCoupon}
                isLoading={isSavingCoupon}
              >
                {isSavingCoupon ? "Generating Coupon..." : "Create Coupon Voucher"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Coupon"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs">
              <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              <span>
                Are you sure you want to delete coupon <strong>{deleteTarget?.code}</strong>?
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleteCouponMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={deleteCouponMutation.isPending}
                isLoading={deleteCouponMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteCouponMutation.isPending ? "Deleting..." : "Delete Coupon"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 3. Coupon Redemption History Modal */}
        <Modal
          isOpen={!!selectedCouponForUsages}
          onClose={() => setSelectedCouponForUsages(null)}
          title={`Redemption History: ${selectedCouponForUsages?.code || "Coupon"}`}
          description="View all patrons who have applied and redeemed this single-use discount voucher"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {isUsagesLoading ? (
              <div className="py-8 text-center text-gray-500">Loading redemption logs...</div>
            ) : couponUsagesList.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xs border border-dashed border-gray-200 text-gray-500">
                <Users size={24} className="mx-auto mb-2 text-gray-400 opacity-60" />
                <p className="font-semibold text-gray-700">No Redemptions Yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  This voucher has not been redeemed on any completed or manual orders.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xs overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F2] border-b border-gray-200 text-gray-700 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Patron Customer</th>
                      <th className="py-2.5 px-3">Contact Email & Phone</th>
                      <th className="py-2.5 px-3">Order Number</th>
                      <th className="py-2.5 px-3 text-right">Redeemed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {couponUsagesList.map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {usage.userFullName || "Patron Customer"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <div>{usage.userEmail}</div>
                          {usage.userPhone && (
                            <div className="text-[10.5px] text-gray-400">{usage.userPhone}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {usage.orderNumber ? (
                            <span className="font-mono font-bold text-[#800020] bg-[#800020]/5 px-1.5 py-0.5 rounded-xs border border-[#800020]/20">
                              {usage.orderNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500">
                          {formatDate(usage.usedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCouponForUsages(null)}
              >
                Close History
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
