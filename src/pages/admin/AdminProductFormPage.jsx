import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Tag,
  Package,
  ListPlus,
} from "lucide-react";
import { productSchema } from "../../schemas/productSchemas.js";
import {
  useProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useDeleteProductImageMutation,
} from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import { generateVariantSku } from "../../utils/skuGenerator.js";
import { validateImageBatch, ACCEPT_IMAGE_STRING } from "../../utils/fileValidation.js";

export default function AdminProductFormPage() {
  const { id } = useParams();

  const navigate = useNavigate();
  const { showToast } = useCart();
  const isEditing = Boolean(id);

  const { data: categories = [] } = useCategoriesQuery();
  const { data: serverProduct } = useProductQuery(id);

  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const uploadImageMutation = useUploadProductImageMutation();
  const deleteImageMutation = useDeleteProductImageMutation();

  // Local state for highlights key-value pairs
  const [highlightPairs, setHighlightPairs] = useState([
    { key: "Fabric", value: "Pure Mulberry Silk" },
    { key: "Pattern", value: "Traditional Weave" },
    { key: "Quality Mark", value: "100% Certified Authentic" },
  ]);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  // Local state for bullet points (aboutItem)
  const [bulletPoints, setBulletPoints] = useState([
    "Crafted with high quality materials and expert workmanship",
    "Detailed finish with premium quality accents",
    "Dry clean or gentle wash recommended for long lasting beauty",
  ]);
  const [newBullet, setNewBullet] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({

    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      brand: "Shreekamalinee",
      originalPrice: 19999,
      offerPrice: 15999,
      sku: "",
      genderCategory: "WOMEN",
      season: "All Season",
      categoryId: "",
      artisanalStory: "",
      fabricCare: "",
      shippingPolicy: "",
      highlights: {},
      aboutItem: [],
      variants: [
        { size: "Free Size", color: "Standard", stockQuantity: 5, sku: "PRD-01" },
      ],
    },
  });

  const isPendingSubmit =
    createProductMutation.isPending || updateProductMutation.isPending || isSubmitting;

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedName = watch("name") || "";
  const watchedOriginalPrice = watch("originalPrice") || 0;
  const watchedOfferPrice = watch("offerPrice") || 0;
  const watchedSku = watch("sku") || "";

  // Auto-generate Master SKU when name changes (in create mode)
  useEffect(() => {
    if (!isEditing && watchedName) {
      const generatedSku =
        "SK-" +
        watchedName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 8) +
        "-" +
        Math.floor(100 + Math.random() * 900);
      setValue("sku", generatedSku, { shouldValidate: true });
    }
  }, [watchedName, isEditing, setValue]);

  // Real-time Auto-populate Variant SKU when clicking "+ Add Variant"
  const handleAddVariant = () => {
    const currentVariants = getValues("variants") || [];
    const masterSku = getValues("sku") || "SKU";
    const existingSkus = currentVariants.map((v) => v?.sku || "");
    const newSku = generateVariantSku(masterSku, "Free Size", "Standard", existingSkus);

    appendVariant({
      size: "Free Size",
      color: "Standard",
      stockQuantity: 1,
      sku: newSku,
    });
  };

  // Real-time Auto-populate Variant SKU when Size or Color is typed
  const handleVariantChange = (idx, field, value) => {
    setValue(`variants.${idx}.${field}`, value);

    const currentVariants = getValues("variants") || [];
    const masterSku = getValues("sku") || "SKU";
    const size = field === "size" ? value : (currentVariants[idx]?.size || "");
    const color = field === "color" ? value : (currentVariants[idx]?.color || "");

    const existingSkus = currentVariants.map((v) => v?.sku || "");
    const uniqueSku = generateVariantSku(masterSku, size, color, existingSkus, idx);
    setValue(`variants.${idx}.sku`, uniqueSku, { shouldValidate: true });
  };

  // Sync all Variant SKUs when Master Product SKU changes in create mode
  useEffect(() => {
    if (watchedSku && !isEditing) {
      const currentVariants = getValues("variants") || [];
      if (currentVariants.length > 0) {
        const existingSkus = [];
        currentVariants.forEach((v, idx) => {
          const uniqueSku = generateVariantSku(watchedSku, v?.size, v?.color, existingSkus, idx);
          existingSkus.push(uniqueSku);
          setValue(`variants.${idx}.sku`, uniqueSku);
        });
      }
    }
  }, [watchedSku, isEditing, setValue, getValues]);

  const [selectedRootId, setSelectedRootId] = useState("");


  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );

  const availableSubcategories = useMemo(() => {
    if (!selectedRootId) return [];
    return categories.filter((c) => c.parentId === selectedRootId);
  }, [categories, selectedRootId]);

  const watchedCategoryId = watch("categoryId");

  // Sync selectedRootId when editing product or when categoryId changes
  useEffect(() => {
    if (watchedCategoryId && categories.length > 0) {
      const currentCat = categories.find((c) => c.id === watchedCategoryId);
      if (currentCat) {
        if (currentCat.parentId) {
          setSelectedRootId(currentCat.parentId);
        } else {
          setSelectedRootId(currentCat.id);
        }
      }
    }
  }, [watchedCategoryId, categories]);

  const handleRootCategoryChange = (e) => {
    const rootId = e.target.value;
    setSelectedRootId(rootId);
    if (!rootId) {
      setValue("categoryId", "", { shouldValidate: true });
      return;
    }

    const subcats = categories.filter((c) => c.parentId === rootId);
    if (subcats.length === 0) {
      setValue("categoryId", rootId, { shouldValidate: true });
    } else {
      // Clear subcategory so user selects from the new filtered list
      setValue("categoryId", "", { shouldValidate: true });
    }
  };

  // Auto-populate specification fields from Category & Parent Category suggestedAttributes
  useEffect(() => {
    if (!isEditing && watchedCategoryId && categories.length > 0) {
      const selectedCat = categories.find((c) => c.id === watchedCategoryId);
      if (selectedCat) {
        // Collect attributes from selected category and its parent root category
        const parentCat = categories.find((c) => c.id === selectedCat.parentId);
        const allSuggested = Array.from(
          new Set([
            ...(parentCat?.suggestedAttributes || []),
            ...(selectedCat.suggestedAttributes || []),
          ])
        );

        if (allSuggested.length > 0) {
          setHighlightPairs((prev) => {
            // Preserve rows where the admin has already entered a value
            const filledRows = prev.filter((p) => p.value && p.value.trim() !== "");
            const filledKeys = new Set(filledRows.map((p) => p.key.toLowerCase()));

            const newEmptyRows = allSuggested
              .filter((attr) => !filledKeys.has(attr.toLowerCase()))
              .map((attr) => ({ key: attr, value: "" }));

            return [...filledRows, ...newEmptyRows];
          });
        }
      }
    }
  }, [watchedCategoryId, categories, isEditing]);

  // Sync server product data into form
  useEffect(() => {
    if (serverProduct) {
      reset({
        name: serverProduct.name || "",
        description: serverProduct.description || "",
        brand: serverProduct.brand || "Shreekamalinee",
        originalPrice: serverProduct.originalPrice || 0,
        offerPrice: serverProduct.offerPrice || 0,
        sku: serverProduct.sku || "",
        genderCategory: serverProduct.genderCategory || "WOMEN",
        season: serverProduct.season || "All Season",
        categoryId: serverProduct.categoryId || "",
        artisanalStory: serverProduct.artisanalStory || "",
        fabricCare: serverProduct.fabricCare || "",
        shippingPolicy: serverProduct.shippingPolicy || "",
        variants: serverProduct.variants?.length
          ? serverProduct.variants
          : [{ size: "Free Size", color: "Standard", stockQuantity: 5, sku: serverProduct.sku + "-01" }],
      });

      if (serverProduct.highlights) {
        setHighlightPairs(
          Object.entries(serverProduct.highlights).map(([k, v]) => ({ key: k, value: String(v) }))
        );
      }
      if (serverProduct.aboutItem) {
        setBulletPoints(serverProduct.aboutItem);
      }
    }
  }, [serverProduct, reset]);

  // Highlight actions
  const handleAddHighlight = (e) => {
    e.preventDefault();
    const trimmedKey = newKey.trim();
    const trimmedVal = newVal.trim();
    if (!trimmedKey) return;

    if (highlightPairs.some((p) => p.key.toLowerCase() === trimmedKey.toLowerCase())) {
      showToast(`Specification attribute "${trimmedKey}" is already in the list!`, "warning");
      return;
    }

    setHighlightPairs([...highlightPairs, { key: trimmedKey, value: trimmedVal }]);
    setNewKey("");
    setNewVal("");
  };

  const handleUpdateHighlightValue = (idx, val) => {
    setHighlightPairs((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, value: val } : p))
    );
  };

  const handleUpdateHighlightKey = (idx, key) => {
    setHighlightPairs((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, key } : p))
    );
  };

  const handleRemoveHighlight = (idx) => {
    setHighlightPairs(highlightPairs.filter((_, i) => i !== idx));
  };

  // Bullet points actions
  const handleAddBullet = (e) => {
    e.preventDefault();
    if (newBullet.trim()) {
      setBulletPoints([...bulletPoints, newBullet.trim()]);
      setNewBullet("");
    }
  };

  const handleRemoveBullet = (idx) => {
    setBulletPoints(bulletPoints.filter((_, i) => i !== idx));
  };

  const [selectedImageFiles, setSelectedImageFiles] = useState([]);

  // Image Select Action (supports instant local preview & direct edit upload with size & format validation)
  const handleSelectImageFiles = (files) => {
    if (!files || files.length === 0) return;

    const validation = validateImageBatch(files);
    if (!validation.valid) {
      showToast(validation.error, "warning");
      return;
    }

    const newItems = validation.validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2, 9),
    }));

    if (isEditing && id) {
      // In edit mode, immediately upload to CDN
      newItems.forEach(async (item) => {
        try {
          await uploadImageMutation.mutateAsync({ id, file: item.file });
          showToast(`Image "${item.file.name}" uploaded to gallery!`, "success");
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to upload image", "warning");
        }
      });
    } else {
      // In create mode, stage for preview and upload on submit
      setSelectedImageFiles((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveLocalImage = (uniqueId) => {
    setSelectedImageFiles((prev) => prev.filter((item) => item.id !== uniqueId));
  };

  // Image Delete Action (Server CDN)
  const handleDeleteImage = async (imageUrl) => {
    if (!id || !imageUrl) return;
    try {
      await deleteImageMutation.mutateAsync({ id, imageUrl });
      showToast("Image removed from gallery", "info");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove image", "warning");
    }
  };

  const onSubmit = async (data) => {
    try {
      const highlightsObj = {};
      highlightPairs.forEach((pair) => {
        if (pair.key?.trim() && pair.value?.trim()) {
          highlightsObj[pair.key.trim()] = pair.value.trim();
        }
      });

      const payload = {
        ...data,
        name: data.name.trim(),
        brand: data.brand.trim() || "Shreekamalinee",
        description: data.description?.trim() || "",
        originalPrice: Number(data.originalPrice),
        offerPrice: data.offerPrice ? Number(data.offerPrice) : undefined,
        highlights: highlightsObj,
        aboutItem: bulletPoints,
        variants: data.variants || [],
      };

      if (isEditing) {
        await updateProductMutation.mutateAsync({ id, data: payload });
        showToast("Product updated successfully!", "success");
      } else {
        const created = await createProductMutation.mutateAsync(payload);
        
        // Sequentially upload all staged local images to the newly created product
        if (selectedImageFiles.length > 0) {
          for (const item of selectedImageFiles) {
            try {
              await uploadImageMutation.mutateAsync({ id: created.id, file: item.file });
            } catch (imgErr) {
              console.error("Failed uploading gallery image:", imgErr);
            }
          }
        }

        showToast("New product and gallery images published successfully!", "success");
        navigate(`/admin/products/edit/${created.id}`);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save product. Please check your inputs.",
        "warning"
      );
    }
  };

  const discountPercent =
    watchedOriginalPrice > 0 && watchedOfferPrice > 0 && watchedOfferPrice < watchedOriginalPrice
      ? Math.round(((watchedOriginalPrice - watchedOfferPrice) / watchedOriginalPrice) * 100)
      : 0;

  return (
    <AdminLayout
      title={isEditing ? `Edit Product: ${watchedName || "Product"}` : "Add Product"}
      subtitle="Publish product listings with specifications, pricing, and gallery images"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">
        {/* Back Link & Action Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <Link
            to="/admin/products"
            className="text-xs font-semibold text-gray-600 hover:text-[#800020] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Products Catalog</span>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            disabled={isPendingSubmit}
            isLoading={isPendingSubmit}
          >
            {isPendingSubmit
              ? isEditing
                ? "Saving Changes..."
                : "Publishing Product..."
              : isEditing
              ? "Save & Update Product"
              : "Publish Product"}
          </Button>
        </div>

        {/* 1. Basic Information */}
        <section className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Sparkles size={16} className="text-[#800020]" />
            <h2 className="font-serif font-bold text-base text-gray-900">
              Basic Product Information
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Product Title / Name *
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Enter product title..."
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.name ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errors.name && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.name.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                {...register("brand")}
                placeholder="Enter brand name (e.g. Shreekamalinee)"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.brand ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errors.brand && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.brand.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Gender Category *
              </label>
              <select
                {...register("genderCategory")}
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium cursor-pointer ${
                  errors.genderCategory ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              >
                <option value="WOMEN">Women</option>
                <option value="MEN">Men</option>
                <option value="KIDS">Kids</option>
                <option value="UNISEX">Unisex</option>
              </select>
              {errors.genderCategory && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.genderCategory.message}</span>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Season / Occasion / Collection Phase
              </label>
              <input
                type="text"
                list="season-suggestions"
                {...register("season")}
                placeholder="e.g. All Season, Festive 2026, Bridal & Wedding, Summer Silks, Monsoon"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.season ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              <datalist id="season-suggestions">
                <option value="All Season" />
                <option value="Festive 2026" />
                <option value="Bridal & Wedding" />
                <option value="Summer Silks" />
                <option value="Daily Heritage" />
                <option value="Winter Royale" />
                <option value="Monsoon Grace" />
              </datalist>
              {errors.season && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.season.message}</span>
              )}
            </div>

            {/* 2-Step Category & Subcategory Selection */}
            <div className="sm:col-span-2 p-3.5 bg-gray-50/80 border border-gray-200 rounded-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                <Layers size={14} className="text-[#800020]" />
                <span>Product Categorization (2-Step Selection)</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Step 1: Main / Root Category */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-700 mb-1">
                    Step 1: Main Category / Collection *
                  </label>
                  <select
                    value={selectedRootId}
                    onChange={handleRootCategoryChange}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose Main Collection --</option>
                    {rootCategories.map((root) => (
                      <option key={root.id} value={root.id}>
                        {root.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Specialized Subcategory */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-700 mb-1">
                    Step 2: Subcategory / Weave / Style *
                  </label>
                  {!selectedRootId ? (
                    <div className="px-3 py-2 text-xs border border-gray-200 rounded-xs bg-gray-100/70 text-gray-400 font-medium">
                      ← Select Main Category First
                    </div>
                  ) : availableSubcategories.length === 0 ? (
                    <div className="flex items-center justify-between px-3 py-2 text-xs border border-emerald-300 rounded-xs bg-emerald-50 text-emerald-800 font-semibold">
                      <span>✓ Root Category Selected (No Subcategories)</span>
                    </div>
                  ) : (
                    <select
                      {...register("categoryId")}
                      className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-semibold cursor-pointer ${
                        errors.categoryId ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                      }`}
                    >
                      <option value="">-- Choose Specific Subcategory --</option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                      <option value={selectedRootId}>
                        General {categories.find((c) => c.id === selectedRootId)?.name} (Root / Uncategorized)
                      </option>
                    </select>
                  )}
                  {errors.categoryId && (
                    <span className="text-[11px] text-rose-600 mt-1 block">{errors.categoryId.message}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Product Description
              </label>
              <textarea
                rows={3}
                {...register("description")}
                placeholder="Describe the product materials, craftsmanship, and styling details..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            {/* Artisanal Heritage Story */}
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Artisanal Heritage & Weave Story (Product Details Tab)
              </label>
              <textarea
                rows={3}
                {...register("artisanalStory")}
                placeholder="Describe the heritage roots, master weaver traditions, handloom techniques, and cultural symbolism of this creation..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
              <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                Rendered on the customer storefront under the "Artisanal Story" accordion tab.
              </span>
            </div>

            {/* Fabric Composition & Wash Care */}
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Fabric & Care Instructions (Product Details Tab)
              </label>
              <textarea
                rows={2}
                {...register("fabricCare")}
                placeholder="e.g. 100% Pure Mulberry Katan Silk with Gold Zari. Dry clean only. Store wrapped in muslin cloth."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
              <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                Rendered under the "Fabric & Care" accordion tab.
              </span>
            </div>

            {/* Shipping & Authenticity Policy */}
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Shipping & Return Notes (Product Details Tab)
              </label>
              <textarea
                rows={2}
                {...register("shippingPolicy")}
                placeholder="e.g. Dispatched in tamper-proof luxury presentation box. Includes Silk Mark & Handloom authenticity certificate."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
              <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                Rendered under the "Shipping & Policy" accordion tab.
              </span>
            </div>
          </div>
        </section>

        {/* 2. Pricing & Inventory SKU */}
        <section className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-[#800020]" />
              <h2 className="font-serif font-bold text-base text-gray-900">
                Pricing & SKU
              </h2>
            </div>
            {discountPercent > 0 && (
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                {discountPercent}% Calculated Discount
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Original Price (₹ MRP) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("originalPrice")}
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errors.originalPrice ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errors.originalPrice && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.originalPrice.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Offer / Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("offerPrice")}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Master SKU *
              </label>
              <input
                type="text"
                {...register("sku")}
                placeholder="e.g. SKU-PRD-001"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errors.sku ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errors.sku && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.sku.message}</span>
              )}
            </div>
          </div>
        </section>

        {/* 3. Multi-Image Gallery CDN */}
        <section className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-100 gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-[#800020]" />
              <div>
                <h2 className="font-serif font-bold text-base text-gray-900 leading-tight">
                  Product Image Gallery (CDN)
                </h2>
                <span className="text-[10.5px] text-gray-500 block">
                  Formats: <strong>JPG, PNG, WebP, GIF</strong> • Max: <strong>10 MB/image</strong> (Min: 100B) • Max batch: <strong>20 MB</strong>
                </span>
              </div>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#800020] text-white text-xs font-semibold rounded-xs cursor-pointer hover:bg-[#600018] transition-colors shadow-xs shrink-0">
              <Upload size={13} />
              <span>Select & Upload Photos</span>
              <input
                type="file"
                accept={ACCEPT_IMAGE_STRING}
                multiple
                className="hidden"
                disabled={uploadImageMutation.isPending}
                onChange={(e) => handleSelectImageFiles(e.target.files)}
              />
            </label>
          </div>

          {(serverProduct?.imageUrls?.length || 0) === 0 && selectedImageFiles.length === 0 ? (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 hover:border-[#800020]/50 rounded-xs bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer text-center space-y-2">
              <Upload size={24} className="text-[#800020]" />
              <div className="text-xs font-bold text-gray-800">
                Click to Select Product Images (Multiple allowed)
              </div>
              <span className="text-[11px] text-gray-500">
                Selected photos will preview below instantly and be uploaded when you publish this product.
              </span>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-[10.5px] text-amber-900 font-medium">
                <span>Allowed: JPG, PNG, WebP, GIF</span>
                <span>•</span>
                <span>Max 10 MB per photo</span>
                <span>•</span>
                <span>Max 20 MB total batch</span>
              </div>
              <input
                type="file"
                accept={ACCEPT_IMAGE_STRING}
                multiple
                className="hidden"
                disabled={uploadImageMutation.isPending}
                onChange={(e) => handleSelectImageFiles(e.target.files)}
              />
            </label>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {/* 1. Existing Server CDN Images */}
              {serverProduct?.imageUrls?.map((imgUrl, index) => (
                <div
                  key={imgUrl}
                  className="relative group rounded-xs overflow-hidden border border-gray-200 aspect-[3/4] bg-gray-100 shadow-xs"
                >
                  <img
                    src={imgUrl}
                    alt={`Product View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-[#800020] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase">
                    {index === 0 ? "Primary" : "CDN Live"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(imgUrl)}
                    className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-rose-600 hover:text-white rounded-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
                    title="Delete Image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {/* 2. Staged Local Preview Images */}
              {selectedImageFiles.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group rounded-xs overflow-hidden border-2 border-dashed border-[#800020]/40 aspect-[3/4] bg-gray-50 shadow-xs"
                >
                  <img
                    src={item.previewUrl}
                    alt={`Staged Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase shadow-xs">
                    {(serverProduct?.imageUrls?.length || 0) === 0 && index === 0 ? "Primary Preview" : "Ready to Upload"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocalImage(item.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-rose-600 hover:text-white rounded-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
                    title="Remove Photo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Product Specifications & Highlights (Key-Value) */}
        <section className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#800020]" />
              <h2 className="font-serif font-bold text-base text-gray-900">
                Product Specifications & Highlights
              </h2>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              {highlightPairs.length} {highlightPairs.length === 1 ? "Attribute" : "Attributes"} Loaded
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Fill in the values for the category attributes below. These will display in the product specification table on your storefront.
          </p>

          {/* Specifications Table */}
          {highlightPairs.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xs text-gray-400 text-xs">
              Select a Category above to automatically load suggested attributes, or add custom specifications below.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-3 w-1/3">Specification / Attribute</th>
                    <th className="py-2.5 px-3 w-7/12">Value (Visible to Patrons)</th>
                    <th className="py-2.5 px-3 text-right w-1/12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium bg-white">
                  {highlightPairs.map((pair, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-3 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/80 border border-amber-200/80 text-amber-900 font-bold rounded-xs text-xs">
                          <Tag size={12} className="text-amber-700 shrink-0" />
                          <span>{pair.key}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <input
                          type="text"
                          value={pair.value}
                          onChange={(e) => handleUpdateHighlightValue(idx, e.target.value)}
                          placeholder={`Enter ${pair.key} (e.g. Pure Mulberry Silk)...`}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium shadow-2xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(idx)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-xs hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Remove ${pair.key}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Custom Product-Specific Specification */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xs space-y-2">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-700">
              + Add Custom Product-Specific Specification
            </label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Custom Attribute (e.g. Border Width, Thread Count)"
                className="w-full sm:w-1/3 px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
              <input
                type="text"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                placeholder="Value (e.g. 4.5 Inches, 120 Count)"
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddHighlight}
                className="shrink-0 cursor-pointer"
              >
                Add Spec
              </Button>
            </div>
          </div>
        </section>

        {/* 5. Bullet Points (About This Item) */}
        <section className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <ListPlus size={16} className="text-[#800020]" />
            <h2 className="font-serif font-bold text-base text-gray-900">
              Key Features & Bullet Points (About Item)
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              placeholder="Enter key feature or bullet point..."
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddBullet}
              className="shrink-0"
            >
              Add Bullet
            </Button>
          </div>

          <ul className="space-y-1.5 border border-gray-200 rounded-xs p-3 divide-y divide-gray-100">
            {bulletPoints.map((bullet, idx) => (
              <li key={idx} className="flex items-center justify-between pt-1.5 text-xs text-gray-700">
                <span className="flex-1">• {bullet}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBullet(idx)}
                  className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer shrink-0 ml-2"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Variants & Warehouse Inventory */}
        <section className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-[#800020]" />
              <h2 className="font-serif font-bold text-base text-gray-900">
                Variants & Warehouse Inventory
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddVariant}
            >
              Add Variant
            </Button>
          </div>

          <div className="space-y-3">
            {variantFields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xs items-center text-xs"
              >
                <div>
                  <label className="block text-[10.5px] uppercase font-bold text-gray-600 mb-1">
                    Size / Dimension
                  </label>
                  <input
                    type="text"
                    {...register(`variants.${idx}.size`)}
                    onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                    placeholder="e.g. Free Size, S, M, L"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-xs font-medium focus:border-[#800020] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase font-bold text-gray-600 mb-1">
                    Color / Shade
                  </label>
                  <input
                    type="text"
                    {...register(`variants.${idx}.color`)}
                    onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                    placeholder="e.g. Red, Yellow, Standard"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-xs font-medium focus:border-[#800020] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase font-bold text-gray-600 mb-1">
                    Stock Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register(`variants.${idx}.stockQuantity`)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-xs font-medium focus:border-[#800020] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase font-bold text-gray-600 mb-1">
                    Variant SKU (Auto-Filled)
                  </label>
                  <input
                    type="text"
                    {...register(`variants.${idx}.sku`)}
                    placeholder="Auto-generated unique SKU"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xs text-xs font-mono font-bold focus:border-[#800020] outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4 sm:pt-0">
                  <button
                    type="button"
                    disabled={variantFields.length <= 1}
                    onClick={() => removeVariant(idx)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    title="Remove variant"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* Submit Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Link
            to="/admin/products"
            className="text-xs text-gray-600 hover:text-[#800020] font-semibold"
          >
            Cancel & Discard
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            disabled={isPendingSubmit}
            isLoading={isPendingSubmit}
          >
            {isPendingSubmit
              ? isEditing
                ? "Saving Changes..."
                : "Publishing Product..."
              : isEditing
              ? "Save & Update Product"
              : "Publish Product"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
