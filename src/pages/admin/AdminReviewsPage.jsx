import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Star,
  Eye,
  AlertTriangle,
  Layers,
  Search,
} from "lucide-react";
import { formatDate } from "../../utils/formatters.js";
import { reviewSchema } from "../../schemas/reviewSchemas.js";
import {
  useProductReviewsQuery,
  useAddAdminReviewMutation,
  useDeleteAdminReviewMutation,
} from "../../queries/useReviewQueries.js";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import RatingStars from "../../components/common/RatingStars.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function AdminReviewsPage() {
  const { showToast } = useCart();

  const { data: products = [] } = useProductsQuery();
  const [selectedProductId, setSelectedProductId] = useState("");

  // Sync selected product
  const activeProductId = selectedProductId || products[0]?.id || "";
  const selectedProduct = products.find((p) => p.id === activeProductId);

  const { data: reviewSummary, isLoading: isReviewsLoading } =
    useProductReviewsQuery(activeProductId);

  const addReviewMutation = useAddAdminReviewMutation();
  const deleteReviewMutation = useDeleteAdminReviewMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewerName: "",
      rating: 5,
      title: "",
      comment: "",
    },
  });

  const isSavingReview = addReviewMutation.isPending || isSubmitting;

  const watchedRating = watch("rating");

  const handleOpenAddModal = () => {
    reset({
      reviewerName: "",
      rating: 5,
      title: "Verified Handloom Patron Experience",
      comment: "",
    });
    setIsAddModalOpen(true);
  };

  const onSubmitReview = async (data) => {
    if (!activeProductId) {
      showToast("Please select a product first", "warning");
      return;
    }
    try {
      await addReviewMutation.mutateAsync({
        productId: activeProductId,
        reviewData: {
          reviewerName: data.reviewerName?.trim() || undefined,
          rating: Number(data.rating),
          title: data.title?.trim() || undefined,
          comment: data.comment.trim(),
        },
      });
      showToast("Verified customer review added to product catalog!", "success");
      setIsAddModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add review", "warning");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReviewMutation.mutateAsync({
        productId: activeProductId,
        reviewId: deleteTarget.id,
      });
      showToast("Review moderated and removed", "info");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete review", "warning");
    }
  };

  const reviews = reviewSummary?.reviews || [];

  return (
    <AdminLayout
      title="Product Reviews & Moderation"
      subtitle="Audit customer feedback, moderate ratings, and publish verified buyer testimonials"
    >
      <div className="space-y-6">
        {/* Product Selector Toolbar */}
        <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-bold uppercase text-gray-600 shrink-0">
              Filter Product:
            </span>
            <select
              value={activeProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full max-w-md px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium truncate"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="shrink-0 cursor-pointer"
          >
            Add Verified Review
          </Button>
        </div>

        {/* Product Review Stats Card */}
        {selectedProduct && (
          <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-16 rounded-xs border border-gray-200 overflow-hidden bg-gray-100 shrink-0">
                {selectedProduct.imageUrls?.[0] ? (
                  <img
                    src={selectedProduct.imageUrls[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Star size={18} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-gray-900">
                  {selectedProduct.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>SKU: {selectedProduct.sku}</span>
                  <span>•</span>
                  <span>{selectedProduct.brand}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 border-l border-gray-200 pl-6">
              <div className="text-center">
                <div className="font-serif font-bold text-2xl text-gray-900">
                  {reviewSummary?.averageRating ? reviewSummary.averageRating.toFixed(1) : "0.0"}
                </div>
                <RatingStars rating={reviewSummary?.averageRating || 0} size={14} />
              </div>
              <div className="text-center border-l border-gray-100 pl-6">
                <div className="font-serif font-bold text-2xl text-gray-900">
                  {reviewSummary?.totalReviews || reviews.length}
                </div>
                <span className="text-[11px] text-gray-400">Total Reviews</span>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-serif font-bold text-sm text-gray-900">
              Customer Reviews ({reviews.length})
            </h4>
          </div>

          <div className="divide-y divide-gray-100 font-medium">
            {isReviewsLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Loading product reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No reviews recorded yet for this product.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 hover:bg-gray-50/70 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={rev.rating} size={13} />
                      {rev.title && (
                        <span className="font-bold text-xs text-gray-900">{rev.title}</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
                      <span className="font-semibold text-gray-700">
                        {rev.userName || "Verified Patron"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(rev.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(rev)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer transition-colors"
                    title="Moderate / Delete Review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Verified Review Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={`Add Review: ${selectedProduct?.name || "Product"}`}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Star Rating (1-5) *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValue("rating", star)}
                    className={`p-1 text-base cursor-pointer ${
                      star <= watchedRating ? "text-amber-500" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Customer Name / Attributed Buyer (Optional)
              </label>
              <input
                type="text"
                {...register("reviewerName")}
                placeholder="e.g. Ananya Mukherjee"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Review Headline / Title
              </label>
              <input
                type="text"
                {...register("title")}
                placeholder="e.g. Exquisite Silk Texture & Rich Zari"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Review Comment *
              </label>
              <textarea
                rows={3}
                {...register("comment")}
                placeholder="Write customer feedback..."
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.comment ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errors.comment && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.comment.message}</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSavingReview}
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSavingReview}
                isLoading={isSavingReview}
              >
                {isSavingReview ? "Publishing Review..." : "Publish Review"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Moderate Review"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs">
              <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              <span>Are you sure you want to remove this customer review?</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleteReviewMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={deleteReviewMutation.isPending}
                isLoading={deleteReviewMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteReviewMutation.isPending ? "Removing..." : "Delete Review"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
