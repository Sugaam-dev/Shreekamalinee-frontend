import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Upload,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";
import {
  useProductsQuery,
  useDeleteProductMutation,
  useUploadProductImageMutation,
} from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { TableRowSkeleton } from "../../components/common/Skeleton.jsx";
import { validateImageFile, ACCEPT_IMAGE_STRING } from "../../utils/fileValidation.js";

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { showToast } = useCart();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'instock' | 'outofstock'
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: products = [], isLoading: isProductsLoading } = useProductsQuery();
  const { data: categories = [] } = useCategoriesQuery();

  const deleteProductMutation = useDeleteProductMutation();
  const uploadImageMutation = useUploadProductImageMutation();

  const handleImageUpload = async (productId, file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, "warning");
      return;
    }

    try {
      await uploadImageMutation.mutateAsync({ id: productId, file });
      showToast("Gallery image uploaded successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload image", "warning");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProductMutation.mutateAsync(deleteTarget.id);
      showToast(`Product "${deleteTarget.name}" deleted successfully`, "info");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete product.", "warning");
    }
  };

  // Filtered products list
  // Compute matching category IDs including all nested subcategories
  const matchingCategoryIds = useMemo(() => {
    if (selectedCategory === "all") return null;
    const ids = new Set([selectedCategory]);

    const addChildren = (parentId) => {
      categories.forEach((c) => {
        if (c.parentId === parentId && !ids.has(c.id)) {
          ids.add(c.id);
          addChildren(c.id);
        }
      });
    };

    addChildren(selectedCategory);
    return ids;
  }, [selectedCategory, categories]);

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedCategoryName = selectedCategoryObj?.name?.toLowerCase();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      (matchingCategoryIds && matchingCategoryIds.has(p.categoryId)) ||
      p.parentCategoryId === selectedCategory ||
      (selectedCategoryName && p.parentCategoryName?.toLowerCase() === selectedCategoryName) ||
      (selectedCategoryName && p.categoryName?.toLowerCase() === selectedCategoryName);

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "instock" && p.inStock) ||
      (stockFilter === "outofstock" && !p.inStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <AdminLayout
      title="Product Catalog"
      subtitle="Manage product listings, pricing, inventory SKUs, and image galleries"
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, SKU, brand, or category..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xs outline-none focus:border-[#800020] bg-white font-medium max-w-[220px]"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories
                .filter((c) => !c.parentId)
                .map((root) => {
                  const subcats = categories.filter((c) => c.parentId === root.id);
                  return (
                    <optgroup key={root.id} label={root.name}>
                      <option value={root.id}>All {root.name} (Root + Subcategories)</option>
                      {subcats.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          — {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              {categories
                .filter((c) => c.parentId && !categories.some((r) => r.id === c.parentId))
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            {/* Stock Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStockFilter("all")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  stockFilter === "all" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("instock")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  stockFilter === "instock" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("outofstock")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  stockFilter === "outofstock" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate("/admin/products/new")}
            className="shrink-0 cursor-pointer"
          >
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Primary Visual</th>
                  <th className="py-3.5 px-4">Product Details & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Pricing</th>
                  <th className="py-3.5 px-4">Inventory Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isProductsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No products found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Image Thumbnail & Fast Upload */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-14 rounded-xs border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                            {product.imageUrls && product.imageUrls[0] ? (
                              <img
                                src={product.imageUrls[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={18} className="text-gray-400" />
                            )}
                          </div>
                          <label
                            className="p-1.5 border border-gray-200 hover:bg-gray-100 rounded-xs cursor-pointer text-gray-600 hover:text-[#800020] transition-colors"
                            title="Upload New Gallery Image"
                          >
                            <Upload size={13} />
                            <input
                              type="file"
                              accept={ACCEPT_IMAGE_STRING}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(product.id, e.target.files[0]);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                        </div>
                      </td>

                      {/* Product Name, SKU & Brand */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-serif font-bold text-sm text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] font-mono text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span className="text-gray-600">{product.brand}</span>
                        </div>
                      </td>

                      {/* Category & Weave */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-full font-semibold">
                          <Layers size={11} />
                          <span>{product.categoryName || "Uncategorized"}</span>
                        </span>
                      </td>

                      {/* Pricing with Discount */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">
                            {formatCurrency(product.offerPrice || product.originalPrice)}
                          </span>
                          {product.offerPrice && product.offerPrice < product.originalPrice && (
                            <span className="line-through text-gray-400 text-[11px]">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        {product.discountPercentage && product.discountPercentage > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            {product.discountPercentage}% OFF
                          </span>
                        )}
                      </td>

                      {/* Inventory Status */}
                      <td className="py-3 px-4">
                        {product.inStock ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                            <CheckCircle size={13} />
                            <span>In Stock ({product.totalStock ?? "Active"})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold">
                            <AlertCircle size={13} />
                            <span>Out of Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="p-1.5 text-gray-600 hover:text-[#800020] hover:bg-gray-100 rounded-xs cursor-pointer transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Product"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs">
              <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              <span>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
                isLoading={deleteProductMutation.isPending}
                onClick={handleConfirmDelete}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
