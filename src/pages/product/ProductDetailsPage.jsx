import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Share2,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Star,
  Sparkles,
  Plus,
  Minus,
  MessageCircle,
  Tag,
  ArrowLeft,
  Package,
  Award,
  Trash2,
  ChevronRight,
  Maximize2,
  ZoomIn,
  X,
  Scroll,
  Info,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import {
  useProductQuery,
  useProductsQuery,
} from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import {
  useProductReviewsQuery,
  useAddCustomerReviewMutation,
  useDeleteCustomerReviewMutation,
} from "../../queries/useReviewQueries.js";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";
import useSEO from "../../hooks/useSEO.js";
import Button from "../../components/common/Button.jsx";
import RatingStars from "../../components/common/RatingStars.jsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";
import ProductCard from "../../components/cards/ProductCard.jsx";
import Modal from "../../components/common/Modal.jsx";


export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, showToast, wishlist, toggleWish, setDrawerOpen } = useCart();

  const { user } = useAuth();

  // 1. Live Backend Product Query
  const { data: product, isLoading: isProductLoading, isError } = useProductQuery(id);
  const { data: categories = [] } = useCategoriesQuery();

  // 2. Reviews Query & Mutation
  const { data: reviewsData, isLoading: isReviewsLoading } = useProductReviewsQuery(id);
  const addReviewMutation = useAddCustomerReviewMutation();
  const deleteReviewMutation = useDeleteCustomerReviewMutation();

  const reviewsList = useMemo(() => reviewsData?.reviews || [], [reviewsData]);
  const averageRating = useMemo(() => {
    if (reviewsData?.averageRating && reviewsData.averageRating > 0) {
      return reviewsData.averageRating;
    }
    if (reviewsList.length > 0) {
      const sum = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      return Math.round((sum / reviewsList.length) * 10) / 10;
    }
    return product?.rating || 4.9;
  }, [reviewsData, reviewsList, product]);

  const totalReviewsCount = useMemo(() => {
    return reviewsData?.totalReviews ?? reviewsList.length;
  }, [reviewsData, reviewsList]);

  // 3. Category Hierarchy Mapping
  const currentCategory = useMemo(() => {
    if (!product?.categoryId || categories.length === 0) return null;
    return categories.find((c) => c.id === product.categoryId);
  }, [product, categories]);

  const parentCategory = useMemo(() => {
    if (!currentCategory?.parentId) return null;
    return categories.find((c) => c.id === currentCategory.parentId);
  }, [currentCategory, categories]);

  // 4. Dynamic Gallery Images
  const galleryImages = useMemo(() => {
    if (product?.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls;
    }
    return [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
    ];
  }, [product]);

  const { data: storeSettings } = useBankDetailsQuery();

  const minDeliveryDays = storeSettings?.estimatedDeliveryDaysMin ?? 3;
  const maxDeliveryDays = storeSettings?.estimatedDeliveryDaysMax ?? 5;
  const returnWindowDays = storeSettings?.returnWindowDays ?? 7;
  const isReturnActive = storeSettings?.isReturnActive ?? true;

  const estimatedDeliveryRange = useMemo(() => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDeliveryDays);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDeliveryDays);

    const options = { day: "numeric", month: "short" };
    return `${minDate.toLocaleDateString("en-IN", options)} - ${maxDate.toLocaleDateString("en-IN", options)}`;
  }, [minDeliveryDays, maxDeliveryDays]);

  const [selectedImg, setSelectedImg] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageFitMode, setImageFitMode] = useState("cover");

  // Sync primary image
  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedImg(galleryImages[0]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, galleryImages]);

  // 5. Variants & Stock State (Direct from Backend Database)
  const variants = useMemo(() => product?.variants || [], [product]);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariantId(variants[0].id || variants[0].sku || "var-0");
    }
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return variants.find((v) => (v.id || v.sku) === selectedVariantId) || variants[0];
  }, [variants, selectedVariantId]);

  const totalStock = Number(
    product?.totalStock ??
    variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0)
  );

  const availableStock = selectedVariant
    ? Number(selectedVariant.stockQuantity ?? 0)
    : totalStock;

  const isSoldOut = Boolean(
    product?.inStock === false ||
    (variants.length > 0 ? availableStock <= 0 : totalStock <= 0)
  );

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("specifications");


  // 6. Pricing & Discount Calculations
  const sellingPrice = product?.offerPrice ?? product?.originalPrice ?? 0;
  const originalMrp = product?.originalPrice ?? sellingPrice;
  const hasDiscount = originalMrp > sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalMrp - sellingPrice) / originalMrp) * 100)
    : 0;

  // 7. Dynamic SEO
  useSEO({
    title: product ? `${product.name} | Shreekamalinee Handlooms` : "Handloom Product Details",
    description: product?.description || "Authentic luxury handloom saree and ethnic attire.",
  });

  const isWishlisted = product && wishlist ? wishlist.has(product.id) : false;

  // 8. Related Products Query
  const { data: allCatProducts = [] } = useProductsQuery({
    categoryId: product?.categoryId || undefined,
  });

  const relatedProducts = useMemo(() => {
    return allCatProducts
      .filter((p) => String(p.id) !== String(id))
      .slice(0, 4);
  }, [allCatProducts, id]);

  // 9. Write Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewerName: "",
    title: "",
    comment: "",
  });

  const handleOpenReviewModal = () => {
    if (!user) {
      showToast("Please sign in to write a verified patron review.", "info");
      navigate("/login", { state: { from: `/details/${id}` } });
      return;
    }

    setReviewForm((prev) => ({
      ...prev,
      reviewerName:
        prev.reviewerName ||
        (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "") ||
        user?.name ||
        user?.email?.split("@")[0] ||
        "",
    }));
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.reviewerName.trim() || !reviewForm.comment.trim()) {
      showToast("Please provide your name and review feedback", "warning");
      return;
    }

    try {
      await addReviewMutation.mutateAsync({
        productId: id,
        reviewData: {
          reviewerName: reviewForm.reviewerName.trim(),
          rating: Number(reviewForm.rating),
          title: reviewForm.title.trim() || undefined,
          comment: reviewForm.comment.trim(),
        },
      });
      showToast("Thank you! Your verified review has been published.", "success");
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, reviewerName: "", title: "", comment: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit review", "warning");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you wish to delete this review?")) return;
    try {
      await deleteReviewMutation.mutateAsync({ productId: id, reviewId });
      showToast("Review deleted successfully", "info");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete review", "error");
    }
  };

  // 10. Add to Bag & Buy Now Handlers
  const handleAddToCart = () => {
    if (!product || isSoldOut) return;
    addToCart(product, qty, { ...selectedVariant, openDrawer: true });
    showToast(`Added "${product.name}" to your shopping bag!`, "success");
  };

  const handleBuyNow = () => {
    if (!product || isSoldOut) return;
    setDrawerOpen(false);
    navigate("/checkout", {
      state: {
        from: location.pathname + location.search,
        directBuyItem: {
          productId: product.id,
          variantId: selectedVariant?.id,
          name: product.name || product.title || "Luxury Handloom Saree",
          price: Number(product.offerPrice ?? product.originalPrice ?? product.price ?? 0),
          qty: qty,
          size: selectedVariant?.size || "Standard",
          color: selectedVariant?.color || "Default",
          image: selectedImg || (Array.isArray(product.imageUrls) && product.imageUrls[0]) || product.image || "/images/placeholder-saree.jpg",
        },
      },
    });
  };




  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || "Shreekamalinee",
        text: `Look at this royal ${product?.name} from Shreekamalinee!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!", "info");
    }
  };

  // Loading Skeleton
  if (isProductLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 sm:w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="aspect-[3/4] bg-gray-200 rounded-sm" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded w-1/2 mt-6" />
                <div className="h-24 bg-gray-200 rounded mt-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found Error
  if (isError || !product) {
    return (
      <div className="bg-[#FAF8F5] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md space-y-4 bg-white p-6 sm:p-8 border border-gray-200 rounded-xs shadow-xs">
          <Package size={40} className="mx-auto text-[#800020]/70" />
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-gray-900">
            Handloom Not Found
          </h2>
          <p className="text-xs text-gray-600">
            The handloom product you are looking for may have been archived or is no longer listed in our atelier collection.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#800020] text-white text-xs font-semibold rounded-xs hover:bg-[#600018] transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  // Highlights / Specifications Map
  const highlightsList = product.highlights
    ? Object.entries(product.highlights).filter(([k, v]) => k && v)
    : [];

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-4 sm:py-8 md:py-12 pb-24 lg:pb-12">
      <div className="max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 space-y-8 sm:space-y-12">
        {/* Breadcrumb Trail */}
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Shop Catalog", to: "/shop" },
            ...(parentCategory
              ? [{ label: parentCategory.name, to: `/shop?category=${encodeURIComponent(parentCategory.name)}` }]
              : []),
            ...(currentCategory
              ? [{ label: currentCategory.name, to: `/shop?category=${encodeURIComponent(currentCategory.name)}` }]
              : []),
            { label: product.name },
          ]}
        />

        {/* Top Product Section: Left Gallery + Right Purchase Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-start">

          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
            {/* Thumbnails (Horizontal on mobile, vertical on sm+) */}
            {galleryImages.length > 1 && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] no-scrollbar shrink-0 w-full sm:w-20 md:w-22 pb-1 sm:pb-0">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImg(img)}
                    className={`w-14 h-18 sm:w-20 sm:h-24 md:w-22 md:h-28 rounded-xs border overflow-hidden cursor-pointer shrink-0 transition-all bg-[#FAF8F5] p-1 flex items-center justify-center ${
                      (selectedImg || galleryImages[0]) === img
                        ? "border-[#800020] ring-2 ring-[#800020]/20 shadow-xs scale-102"
                        : "border-[#E6DFD3] opacity-75 hover:opacity-100 hover:border-[#800020]/60"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-contain object-center"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image (Portrait aspect-ratio, ambient studio glow, edge-to-edge fill) */}
            <div className="flex-1 w-full aspect-[3/4] sm:aspect-[4/5] max-h-[540px] bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs overflow-hidden relative shadow-sm group flex items-center justify-center">
              {/* Ambient Blurred Studio Background to eliminate blank side spaces */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-120 pointer-events-none transition-all duration-700"
                style={{ backgroundImage: `url(${selectedImg || galleryImages[0]})` }}
              />

              <img
                src={selectedImg || galleryImages[0]}
                alt={product.name}
                className={`relative z-10 w-full h-full transition-transform duration-500 group-hover:scale-103 cursor-zoom-in select-none ${
                  imageFitMode === "cover" ? "object-cover object-top" : "object-contain object-center p-2"
                }`}
                onClick={() => setIsImageModalOpen(true)}
              />

              {/* View Control Toolbar */}
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xs border border-[#E6DFD3] shadow-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageFitMode((prev) => (prev === "cover" ? "contain" : "cover"));
                  }}
                  className="text-[10.5px] uppercase font-bold text-gray-700 hover:text-[#800020] px-1 py-0.5 rounded-xs transition-colors cursor-pointer"
                  title="Toggle between Full Saree fit and Full Frame fill"
                >
                  {imageFitMode === "cover" ? "Fit View" : "Fill View"}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="text-[#221D1B] hover:text-[#800020] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="Click to inspect full weave"
                >
                  <Maximize2 size={12} />
                  <span className="hidden sm:inline">Inspect</span>
                </button>
              </div>

              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 bg-[#800020] text-white text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-xs shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
              {isSoldOut && (
                <div className="absolute inset-0 z-20 bg-gray-900/60 flex items-center justify-center backdrop-blur-xs">
                  <span className="bg-gray-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xs shadow-md">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Right Column: Product Details & Purchase Actions */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">

            {/* Header: Collection Category & Share */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#800020]">
                {parentCategory ? `${parentCategory.name} • ` : ""}
                {currentCategory?.name || product.brand || "Authentic Handloom"}
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="text-gray-500 hover:text-[#800020] p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Share this handloom"
              >
                <Share2 size={16} />
              </button>
            </div>

            {/* Title & Brand */}
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">By {product.brand || "Shreekamalinee"}</span>
                <span>•</span>
                <span className="font-mono text-gray-400">SKU: {selectedVariant?.sku || product.sku}</span>
              </div>
            </div>

            {/* Rating & Reviews Header */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xs border border-amber-200">
                <RatingStars rating={averageRating} size={14} />
                <span className="font-bold text-amber-900">{Number(averageRating).toFixed(1)}</span>
              </div>
              <span className="text-gray-300">|</span>
              <a
                href="#reviews-section"
                className="text-gray-600 hover:text-[#800020] transition-colors underline font-medium"
              >
                {totalReviewsCount} Verified Patron Reviews
              </a>
            </div>

            {/* Price Presentation */}
            <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 pt-3 border-t border-gray-200">
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {formatCurrency(sellingPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base text-gray-400 line-through font-medium">
                  {formatCurrency(originalMrp)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-xs">
                  Save {formatCurrency(originalMrp - sellingPrice)} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Inclusive of all taxes & GST. Free insured luxury courier packaging across India.
            </p>

            {/* Variant Selector for Multi-Variant Products */}
            {variants.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-gray-800 flex items-center gap-1.5">
                    <span>Select Size / Variant:</span>
                    <strong className="text-[#800020] font-bold">
                      {selectedVariant?.size || "Standard"}
                      {selectedVariant?.color && selectedVariant.color !== "Standard"
                        ? ` • ${selectedVariant.color}`
                        : ""}
                    </strong>
                  </label>
                  {variants.length > 1 && (
                    <span className="text-[10.5px] text-gray-500 font-medium">
                      ({variants.length} options available)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {variants.map((v, idx) => {
                    const vId = v.id || v.sku || `var-${idx}`;
                    const isSelected = (selectedVariant?.id || selectedVariant?.sku || selectedVariantId) === (v.id || v.sku || vId);
                    const isOutOfStock = (v.stockQuantity ?? 0) <= 0;

                    return (
                      <button
                        key={vId}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id || v.sku || vId)}
                        disabled={isOutOfStock}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xs border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? "border-[#800020] bg-[#800020]/10 text-[#800020] shadow-xs ring-1 ring-[#800020]"
                            : isOutOfStock
                            ? "border-gray-200 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed line-through"
                            : "border-[#E6DFD3] bg-white text-gray-800 hover:border-[#800020] hover:text-[#800020]"
                        }`}
                      >
                        <span className="font-bold">{v.size || "Standard"}</span>
                        {v.color && v.color !== "Standard" && (
                          <span className="text-[11px] font-normal opacity-85">({v.color})</span>
                        )}
                        {v.stockQuantity > 0 && v.stockQuantity <= 3 && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-xs border border-amber-200">
                            {v.stockQuantity} left
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Live Inventory Status Ribbon */}
            <div className="flex items-center gap-2 text-xs">
              {isSoldOut ? (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-xs border border-rose-200">
                  <span>✕ Out of Stock / Crafted on Request</span>
                </span>
              ) : availableStock <= 3 ? (
                <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-xs border border-amber-200 animate-pulse">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>⚡ Only {availableStock} {availableStock === 1 ? "unit" : "units"} remaining in atelier!</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-xs border border-emerald-200">
                  <CheckCircle size={13} className="text-emerald-600" />
                  <span>✓ In Stock ({availableStock} units available)</span>
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-gray-800">
                Quantity:
              </span>
              <div className="flex items-center border border-gray-300 bg-white rounded-xs">
                <button
                  type="button"
                  disabled={qty <= 1 || isSoldOut}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-2 text-gray-600 hover:text-[#800020] disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-bold text-xs text-gray-900">{qty}</span>
                <button
                  type="button"
                  disabled={qty >= Math.min(10, availableStock) || isSoldOut}
                  onClick={() => setQty(qty + 1)}
                  className="p-2 text-gray-600 hover:text-[#800020] disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Primary Action Buttons (Desktop & Tablet) */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isSoldOut}
                  onClick={handleAddToCart}
                  icon={ShoppingBag}
                >
                  {isSoldOut ? "Sold Out" : "Add to Bag"}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={isSoldOut}
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>

                <button
                  type="button"
                  onClick={() => toggleWish(product.id)}
                  className={`p-3 border rounded-xs transition-colors cursor-pointer flex items-center justify-center shadow-xs ${
                    isWishlisted
                      ? "border-[#800020] bg-[#800020]/10 text-[#800020]"
                      : "border-gray-300 bg-white text-gray-600 hover:border-[#800020] hover:text-[#800020]"
                  }`}
                  title="Save to Wishlist"
                >
                  <Heart size={20} className={isWishlisted ? "fill-[#800020]" : ""} />
                </button>
              </div>

              {/* Direct WhatsApp Concierge Inquiry */}
              <a
                href={`https://wa.me/${(storeSettings?.whatsappNumber || storeSettings?.contactPhone || "919820785210").replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Namaste Shreekamalinee! I am inquiring about "${product.name}" (SKU: ${product.sku}). Is it available for express dispatch?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366]/10 border border-[#25D366]/40 hover:bg-[#25D366]/20 text-[#128C7E] text-[11px] sm:text-xs uppercase font-bold tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageCircle size={16} />
                <span>Inquire on WhatsApp with Stylist</span>
              </a>
            </div>

            {/* Pre-Order Delivery Estimation & Assurance Badges */}
            <div className="space-y-2.5 pt-3 border-t border-gray-200 text-xs">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xs flex items-center gap-2.5 text-emerald-900">
                <Truck size={16} className="text-[#800020] shrink-0" />
                <span className="text-[12px]">
                  Estimated Delivery: <strong>{estimatedDeliveryRange}</strong> (Dispatch within {minDeliveryDays}–{maxDeliveryDays} business days)
                </span>
              </div>

              {storeSettings?.deliveryPolicyNotice && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xs text-[11.5px] text-amber-900 flex items-start gap-2 leading-relaxed">
                  <AlertCircle size={15} className="text-amber-800 shrink-0 mt-0.5" />
                  <span>{storeSettings.deliveryPolicyNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#800020] shrink-0" />
                  <span>100% Certified Authentic Handloom</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-[#800020] shrink-0" />
                  <span>
                    {isReturnActive
                      ? `${returnWindowDays}-Day Return / Exchange Guarantee`
                      : "Final Sale / Authentic Artisan Piece"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Specifications, Features, Fabric & Care, Shipping */}
        <div id="product-details-section" className="bg-white border border-[#E6DFD3] rounded-sm p-4 sm:p-6 md:p-7 shadow-xs space-y-4 sm:space-y-5">

          {/* Tab Selector Header */}
          <div className="flex border-b border-[#E6DFD3] gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px">
            {[
              { id: "specifications", label: "Highlights & Specs", icon: Sparkles, badge: highlightsList.length > 0 ? highlightsList.length : null },
              { id: "about", label: "Artisanal Story", icon: Scroll },
              { id: "care", label: "Fabric & Care", icon: RefreshCw },
              { id: "shipping", label: "Shipping & Policy", icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer rounded-t-xs border-b-2 ${
                    isActive
                      ? "border-[#800020] text-[#800020] bg-[#FAF8F5]/80"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-[#800020]" : "text-gray-400"} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-[#800020]/10 text-[#800020] text-[10px] font-bold rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="py-2 text-xs sm:text-sm text-gray-700 leading-relaxed min-h-[160px]">
            {/* 1. Specifications Tab */}
            {activeTab === "specifications" && (
              <div className="space-y-4">
                {/* Key Technical Highlights Grid */}
                {highlightsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {highlightsList.map(([key, val], idx) => (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-3 bg-[#FAF8F5] border border-[#E6DFD3]/80 rounded-xs flex items-start gap-2.5"
                      >
                        <Tag size={13} className="text-[#800020] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10.5px] uppercase font-bold text-gray-500 block truncate">
                            {key}
                          </span>
                          <strong className="text-xs sm:text-[13px] font-semibold text-gray-900 break-words">
                            {val}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs text-xs text-gray-600">
                    Handcrafted according to authentic Indian textile pitloom specifications.
                  </div>
                )}

                {/* About Item Bullet Badges */}
                {product.aboutItem && product.aboutItem.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-gray-500 block">
                      Atelier Weave Features:
                    </span>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {product.aboutItem.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-800 bg-white p-2 rounded-xs border border-gray-100">
                          <span className="text-[#800020] font-bold mt-0.5">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core Metadata Bar */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3 sm:gap-6 text-[11.5px] text-gray-500">
                  {product.brand && (
                    <>
                      <span><strong>Brand:</strong> {product.brand}</span>
                      <span>•</span>
                    </>
                  )}
                  <span><strong>Category:</strong> {product.categoryName || product.genderCategory || "Handloom"}</span>
                  {product.season && (
                    <>
                      <span>•</span>
                      <span><strong>Season:</strong> {product.season}</span>
                    </>
                  )}
                  <span>•</span>
                  <span><strong>SKU:</strong> <span className="font-mono">{selectedVariant?.sku || product.sku}</span></span>
                </div>
              </div>
            )}

            {/* 2. Artisanal Details Tab */}
            {activeTab === "about" && (
              <div className="space-y-3.5 max-w-3xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020] shrink-0 mt-0.5">
                    <Award size={16} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900">
                      Heritage & Craftsmanship of {product.name}
                    </h4>
                    <p className="text-xs sm:text-[13px] leading-relaxed text-gray-700 mt-1 whitespace-pre-line">
                      {product.artisanalStory ||
                        product.description ||
                        "Artisanal heritage specifications for this handcrafted creation."}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xs text-[11.5px] text-amber-900 flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-[#800020] shrink-0" />
                  <span>
                    <strong>Authenticity Guarantee:</strong> Certified authentic artisan inspection seal from {product.brand || "Shreekamalinee"}.
                  </span>
                </div>
              </div>
            )}

            {/* 3. Fabric & Wash Care Tab */}
            {activeTab === "care" && (
              <div className="space-y-3.5">
                {product.fabricCare ? (
                  <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs text-xs sm:text-[13px] text-gray-800 leading-relaxed whitespace-pre-line">
                    <strong className="block font-serif font-bold text-sm text-[#800020] mb-1">
                      Material Composition & Care Guide
                    </strong>
                    {product.fabricCare}
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs text-xs text-gray-600">
                    Please refer to the care label on the garment for specific washing and handling instructions.
                  </div>
                )}
              </div>
            )}

            {/* 4. Shipping & Returns Tab */}
            {activeTab === "shipping" && (
              <div className="space-y-3">
                {product.shippingPolicy ? (
                  <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs text-xs sm:text-[13px] text-gray-800 leading-relaxed whitespace-pre-line">
                    <strong className="block font-serif font-bold text-sm text-[#800020] mb-1">
                      Packaging & Dispatch Notes
                    </strong>
                    {product.shippingPolicy}
                  </div>
                ) : null}

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs space-y-1">
                    <strong className="text-[#800020] font-bold block text-[11.5px] uppercase tracking-wider">
                      Free Insured Shipping
                    </strong>
                    <p className="text-gray-600 text-[11px]">
                      Complimentary luxury courier on orders above {formatCurrency(storeSettings?.freeShippingThreshold || 1499)} across all Indian pincodes.
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs space-y-1">
                    <strong className="text-gray-900 font-bold block text-[11.5px] uppercase tracking-wider">
                      Turnaround ({minDeliveryDays}–{maxDeliveryDays} Days)
                    </strong>
                    <p className="text-gray-600 text-[11px]">
                      Expected delivery within {minDeliveryDays} to {maxDeliveryDays} business days via Blue Dart / Speed Post with 1-click postal tracking.
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xs space-y-1">
                    <strong className="text-gray-900 font-bold block text-[11.5px] uppercase tracking-wider">
                      {isReturnActive ? `${returnWindowDays}-Day Policy` : "Artisan Inspection"}
                    </strong>
                    <p className="text-gray-600 text-[11px]">
                      {storeSettings?.returnPolicyText ||
                        (isReturnActive
                          ? `Hassle-free ${returnWindowDays}-day return or exchange for unworn pieces with security seals intact.`
                          : "Each piece is hand-inspected and stamped authentic prior to luxury dispatch.")}
                    </p>
                  </div>
                </div>

                {storeSettings?.deliveryPolicyNotice && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xs text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle size={16} className="text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">Mandatory Return & Exchange Condition:</strong>
                      <span>{storeSettings.deliveryPolicyNotice}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Customer Reviews Section */}
        <div id="reviews-section" className="space-y-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#800020]">
                Customer Testimonials
              </span>
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Verified Patron Reviews ({totalReviewsCount})
              </h3>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={handleOpenReviewModal}
              className="cursor-pointer"
            >
              Write a Review
            </Button>
          </div>

          {reviewsList.length === 0 ? (
            <div className="p-8 sm:p-10 text-center bg-white border border-gray-200 rounded-xs space-y-3 shadow-xs">
              <RatingStars rating={5} size={20} className="justify-center" />
              <h4 className="font-serif font-bold text-base text-gray-900">
                Be the first to review this handloom masterpiece!
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Share your feedback on the fabric drape, zari luster, and packaging to assist fellow connoisseurs.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenReviewModal}
                className="mt-2"
              >
                Write First Review
              </Button>
            </div>
          ) : (
            <div className="relative pb-8 reviews-swiper-container">
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={16}
                slidesPerView={1.15}
                autoplay={{
                  delay: 4500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                loop={reviewsList.length > 3}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 16,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                  },
                }}
                className="!pb-10"
              >
                {reviewsList.map((rev) => {
                  const canDelete =
                    user &&
                    (user.id === rev.userId ||
                      user.role === "ROLE_ADMIN" ||
                      user.role === "ROLE_SUPERADMIN");

                  const reviewerDisplayName =
                    rev.userName || rev.reviewerName || "Verified Patron";

                  return (
                    <SwiperSlide key={rev.id} className="!h-auto">
                      <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xs shadow-xs space-y-3 flex flex-col justify-between h-full hover:border-[#800020]/40 transition-colors">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <RatingStars rating={rev.rating} size={14} />
                            <span className="text-[11px] text-gray-400 font-mono">
                              {formatDate(rev.createdAt)}
                            </span>
                          </div>
                          {rev.title && (
                            <strong className="font-serif font-bold text-sm text-gray-900 block line-clamp-1">
                              "{rev.title}"
                            </strong>
                          )}
                          <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                            {rev.comment}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {reviewerDisplayName}
                            </span>
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle size={12} />
                              <span>Verified</span>
                            </span>
                          </div>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              disabled={deleteReviewMutation.isPending}
                              className="text-gray-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="Delete this review"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-8 sm:pt-10 space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#800020]">
                Complete the Ensemble
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                You May Also Admire
              </h3>
              <div className="w-12 h-0.5 bg-[#800020] mx-auto mt-3" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sticky Purchase Action Bar (Below lg screens) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 flex items-center gap-2 lg:hidden shadow-lg">
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          className={`p-2.5 border rounded-xs transition-colors shrink-0 ${
            isWishlisted
              ? "border-[#800020] bg-[#800020]/10 text-[#800020]"
              : "border-gray-300 bg-white text-gray-600"
          }`}
          title="Save to Wishlist"
        >
          <Heart size={18} className={isWishlisted ? "fill-[#800020]" : ""} />
        </button>

        <Button
          variant="primary"
          size="md"
          className="flex-1 text-xs"
          disabled={isSoldOut}
          onClick={handleAddToCart}
        >
          {isSoldOut ? "Sold Out" : "Add to Bag"}
        </Button>

        <Button
          variant="secondary"
          size="md"
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs"
          disabled={isSoldOut}
          onClick={handleBuyNow}
        >
          Buy Now
        </Button>
      </div>

      {/* Write Customer Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Share Your Experience"
        subtitle={`Reviewing ${product.name}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-2">
              Your Rating *
            </label>
            <RatingStars
              rating={reviewForm.rating}
              size={22}
              interactive={true}
              onRatingChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
              Your Full Name *
            </label>
            <input
              type="text"
              required
              value={reviewForm.reviewerName}
              onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
              placeholder="e.g. Radhika Apte"
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
              Review Headline Title
            </label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="e.g. Stunning Zari Weave & Flawless Drape"
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
              Your Detailed Feedback *
            </label>
            <textarea
              required
              rows={4}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Write about the fabric softness, weave density, color vibrancy, and packaging..."
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] resize-none bg-white font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={addReviewMutation.isPending}
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={addReviewMutation.isPending}
              isLoading={addReviewMutation.isPending}
            >
              {addReviewMutation.isPending ? "Submitting..." : "Submit Verified Review"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* High-Resolution Weave Inspector Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-10 right-0 sm:-right-8 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Viewer"
            >
              <X size={24} />
            </button>
            <div className="w-full max-h-[82vh] overflow-hidden rounded-xs border border-white/20 bg-black/40 flex items-center justify-center">
              <img
                src={selectedImg || galleryImages[0]}
                alt={product.name}
                className="max-h-[80vh] w-auto max-w-full object-contain select-none shadow-2xl"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-white/75 text-xs">
              <Sparkles size={14} className="text-amber-400" />
              <span>Full Uncropped Atelier Weave View • {product.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

