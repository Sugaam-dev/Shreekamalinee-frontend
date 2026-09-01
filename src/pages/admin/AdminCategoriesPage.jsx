import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  FolderTree,
  Image as ImageIcon,
  Tag,
  X,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  Folder,
} from "lucide-react";
import { categorySchema } from "../../schemas/categorySchemas.js";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadCategoryImageMutation,
} from "../../queries/useCategoryQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { TableRowSkeleton } from "../../components/common/Skeleton.jsx";
import { validateImageFile, ACCEPT_IMAGE_STRING } from "../../utils/fileValidation.js";

// Known smart suggestions presets for core handloom & apparel collections
const PRESET_SUGGESTIONS = {
  sarees: ["Fabric", "Weave Technique", "Occasion", "Wash Care", "Saree Length", "Zari Purity"],
  "dress-material": ["Top Fabric", "Bottom Fabric", "Dupatta Fabric", "Stitch Type", "Top Length", "Occasion"],
  readymade: ["Fabric", "Fit Type", "Pattern / Print", "Neckline", "Sleeve Length", "Occasion"],
  accessories: ["Material / Fabric", "Craft Style", "Closure Type", "Dimensions", "Care Instructions"],
};

// Universal quick-add attribute chips for any category
const UNIVERSAL_QUICK_CHIPS = [
  "Fabric / Material",
  "Craft / Technique",
  "Occasion",
  "Wash Care",
  "Dimensions / Size",
  "Color / Pattern",
  "Weight",
  "Stitch Type",
];

export default function AdminCategoriesPage() {
  const { showToast } = useCart();
  const { data: categories = [], isLoading } = useCategoriesQuery();

  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const uploadImageMutation = useUploadCategoryImageMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [hierarchyFilter, setHierarchyFilter] = useState("all"); // 'all' | 'root' | 'sub'
  const [parentFilter, setParentFilter] = useState("all"); // 'all' | specific parentId

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [attrInput, setAttrInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const rootCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
      imageUrl: "",
      suggestedAttributes: [],
    },
  });

  const isSavingCategory =
    createCategoryMutation.isPending || updateCategoryMutation.isPending || isSubmitting;

  const watchedParentId = watch("parentId");
  const selectedParentCat = categories.find((c) => c.id === watchedParentId);
  const parentAttributes = useMemo(() => selectedParentCat?.suggestedAttributes || [], [selectedParentCat]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setAttributes([]);
    setImageFile(null);
    setImagePreview("");
    reset({
      name: "",
      slug: "",
      parentId: "",
      imageUrl: "",
      suggestedAttributes: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    // Only store specialized subcategory attributes (exclude parent attributes if any)
    const parent = categories.find((c) => c.id === cat.parentId);
    const parentTags = new Set((parent?.suggestedAttributes || []).map((a) => a.toLowerCase().trim()));
    const specializedOnly = (cat.suggestedAttributes || []).filter(
      (a) => !parentTags.has(a.toLowerCase().trim())
    );

    setAttributes(specializedOnly);
    setImageFile(null);
    setImagePreview(cat.imageUrl || "");
    reset({
      name: cat.name || "",
      slug: cat.slug || "",
      parentId: cat.parentId || "",
      imageUrl: cat.imageUrl || "",
      suggestedAttributes: specializedOnly,
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, "warning");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImagePreview = () => {
    setImageFile(null);
    setImagePreview("");
    setValue("imageUrl", "");
  };

  // When parent changes, filter out any existing attributes that parent already provides
  const handleParentSelect = (e) => {
    const parentId = e.target.value;
    setValue("parentId", parentId);
    if (parentId) {
      const parent = categories.find((c) => c.id === parentId);
      const parentSet = new Set((parent?.suggestedAttributes || []).map((a) => a.toLowerCase().trim()));
      // Keep only unique specialized attributes
      setAttributes((prev) => prev.filter((a) => !parentSet.has(a.toLowerCase().trim())));
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setValue("name", val);
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug);

      // Check preset suggestions if it is a root category and attributes list is empty
      if (!watchedParentId && attributes.length === 0) {
        const slugKey = generatedSlug.toLowerCase();
        for (const [key, tags] of Object.entries(PRESET_SUGGESTIONS)) {
          if (slugKey.includes(key) || key.includes(slugKey)) {
            setAttributes(tags);
            break;
          }
        }
      }
    }
  };

  const handleAddAttribute = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const trimmed = attrInput.trim();
      if (!trimmed) return;

      const lower = trimmed.toLowerCase();

      // Check if already inherited from parent
      if (parentAttributes.some((a) => a.toLowerCase().trim() === lower)) {
        showToast(`"${trimmed}" is already inherited from parent "${selectedParentCat?.name}"!`, "info");
        setAttrInput("");
        return;
      }

      // Check if already in current list
      if (attributes.some((a) => a.toLowerCase().trim() === lower)) {
        showToast(`"${trimmed}" is already added!`, "warning");
        setAttrInput("");
        return;
      }

      setAttributes([...attributes, trimmed]);
      setAttrInput("");
    }
  };

  const handleAddQuickChip = (chip) => {
    const lower = chip.toLowerCase().trim();
    if (parentAttributes.some((a) => a.toLowerCase().trim() === lower)) {
      showToast(`"${chip}" is already inherited from parent "${selectedParentCat?.name}"!`, "info");
      return;
    }
    if (attributes.some((a) => a.toLowerCase().trim() === lower)) {
      showToast(`"${chip}" is already added!`, "warning");
      return;
    }
    setAttributes([...attributes, chip]);
  };

  const handleRemoveAttribute = (attr) => {
    setAttributes(attributes.filter((a) => a !== attr));
  };

  const onSubmit = async (data) => {
    try {
      // Ensure we only save specialized unique attributes (never duplicate parent attributes in DB)
      const parentSet = new Set(parentAttributes.map((a) => a.toLowerCase().trim()));
      const cleanedAttributes = attributes.filter((a) => !parentSet.has(a.toLowerCase().trim()));

      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        parentId: data.parentId ? data.parentId : null,
        imageUrl: data.imageUrl?.trim() || null,
        suggestedAttributes: cleanedAttributes,
      };

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data: payload });
        if (imageFile) {
          await uploadImageMutation.mutateAsync({ id: editingCategory.id, file: imageFile });
        }
        showToast("Category updated successfully!", "success");
      } else {
        const created = await createCategoryMutation.mutateAsync(payload);
        if (imageFile && created?.id) {
          await uploadImageMutation.mutateAsync({ id: created.id, file: imageFile });
        }
        showToast("Category created successfully!", "success");
      }

      setIsModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save category", "warning");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategoryMutation.mutateAsync(deleteTarget.id);
      showToast(`Category "${deleteTarget.name}" deleted successfully`, "info");
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Cannot delete category with associated products/subcategories",
        "warning"
      );
    }
  };

  const handleImageUpload = async (catId, file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, "warning");
      return;
    }

    try {
      await uploadImageMutation.mutateAsync({ id: catId, file });
      showToast("Category banner image uploaded successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload image", "warning");
    }
  };

  // Filter categories list
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        category.name?.toLowerCase().includes(term) ||
        category.slug?.toLowerCase().includes(term) ||
        category.suggestedAttributes?.some((a) => a.toLowerCase().includes(term));

      const isRoot = !category.parentId;
      const matchesHierarchy =
        hierarchyFilter === "all" ||
        (hierarchyFilter === "root" && isRoot) ||
        (hierarchyFilter === "sub" && !isRoot);

      return matchesSearch && matchesHierarchy;
    });
  }, [categories, searchTerm, hierarchyFilter]);

  return (
    <AdminLayout
      title="Categories & Weave Hierarchy"
      subtitle="Organize root apparel collections, specialized handloom subcategories, and search filter attributes"
    >
      <div className="space-y-6">
        {/* Action & Filter Toolbar */}
        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories, slugs, or attributes..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            {/* Hierarchy Filter Button Tabs (All / Root / Subcategories) */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setHierarchyFilter("all")}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  hierarchyFilter === "all"
                    ? "bg-[#800020] text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setHierarchyFilter("root")}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  hierarchyFilter === "root"
                    ? "bg-[#800020] text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Root Categories ({rootCategories.length})
              </button>
              <button
                type="button"
                onClick={() => setHierarchyFilter("sub")}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  hierarchyFilter === "sub"
                    ? "bg-[#800020] text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Subcategories ({categories.length - rootCategories.length})
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="shrink-0 cursor-pointer shadow-2xs"
          >
            Create Category
          </Button>
        </div>

        {/* Categories Table */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4 w-12">Visual</th>
                  <th className="py-3.5 px-4">Category Name & Slug</th>
                  <th className="py-3.5 px-4">Hierarchy Level</th>
                  <th className="py-3.5 px-4">Inherited / Filter Attributes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={5} />
                  ))
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      No categories found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => {
                    const isRoot = !category.parentId;
                    const parentCat = categories.find((c) => c.id === category.parentId);

                    return (
                      <tr key={category.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Visual Image / Upload */}
                        <td className="py-3 px-4">
                          <div className="relative group w-10 h-10 rounded-xs border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderTree size={16} className="text-gray-400" />
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                              <Upload size={12} />
                              <input
                                type="file"
                                accept={ACCEPT_IMAGE_STRING}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleImageUpload(category.id, e.target.files[0]);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>

                        {/* Name & Slug */}
                        <td className="py-3 px-4">
                          <div className="font-serif font-bold text-sm text-gray-900 flex items-center gap-1.5">
                            {!isRoot && <span className="text-[#800020]/40 font-mono text-xs">↳</span>}
                            <span>{category.name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">
                            /{category.slug}
                          </span>
                        </td>

                        {/* Hierarchy Badge */}
                        <td className="py-3 px-4">
                          {isRoot ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xs text-[10.5px] font-bold">
                              <Folder size={11} />
                              <span>Root Category</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xs text-[10.5px] font-medium">
                              <span>Subcategory of: </span>
                              <strong className="text-gray-900">{parentCat?.name || "Parent"}</strong>
                            </span>
                          )}
                        </td>

                        {/* Filter Attributes Tags */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {category.suggestedAttributes && category.suggestedAttributes.length > 0 ? (
                              category.suggestedAttributes.map((attr) => (
                                <span
                                  key={attr}
                                  className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-[#800020] rounded-xs text-[10.5px] font-semibold"
                                >
                                  {attr}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-[11px] italic">
                                None defined (Click edit to add)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(category)}
                              className="p-1.5 text-gray-500 hover:text-[#800020] hover:bg-gray-100 rounded-xs cursor-pointer transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(category)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Category Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? "Edit Category" : "Create New Category"}
          subtitle="Configure category naming, weave hierarchy, banner visual, and search filter specifications"
          size="xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  {...register("name")}
                  onChange={handleNameChange}
                  placeholder="e.g. Sarees, Dress Material, Paithani"
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
                  URL Slug (Auto-Generated)
                </label>
                <input
                  type="text"
                  {...register("slug")}
                  placeholder="e.g. paithani-sarees"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Parent Category (Hierarchy Level)
              </label>
              <select
                value={watchedParentId || ""}
                onChange={handleParentSelect}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium cursor-pointer"
              >
                <option value="">None (Top-Level Root Category)</option>
                {rootCategories
                  .filter((m) => !editingCategory || m.id !== editingCategory.id)
                  .map((main) => (
                    <option key={main.id} value={main.id}>
                      {main.name}
                    </option>
                  ))}
              </select>
              <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                Selecting a parent category will automatically suggest and inherit its base attributes.
              </span>
            </div>

            {/* Dual Mode Banner Image Uploader */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Category Banner / Thumbnail Visual
              </label>

              <div className="grid sm:grid-cols-2 gap-3 items-center">
                {/* File Upload Trigger */}
                <div>
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 hover:border-[#800020] rounded-xs cursor-pointer bg-gray-50 hover:bg-gray-100/70 transition-colors">
                    <Upload size={18} className="text-[#800020] mb-1" />
                    <span className="text-xs font-semibold text-gray-700">Choose Image File</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, WEBP, GIF (up to 10MB)</span>
                    <input
                      type="file"
                      accept={ACCEPT_IMAGE_STRING}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileChange(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Preview Box */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xs border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center relative shrink-0 shadow-2xs">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImagePreview}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <ImageIcon size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 flex-1">
                    {imageFile ? (
                      <span className="font-semibold text-emerald-700 block truncate">
                        ✓ {imageFile.name}
                      </span>
                    ) : (
                      <span>No image selected yet. Upload a file or paste a URL below.</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  {...register("imageUrl")}
                  placeholder="Or paste external image URL: https://..."
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
              </div>
            </div>

            {/* Suggested Attributes Tag Input */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {/* Inherited Parent Attributes (Read-Only Badges) */}
              {watchedParentId && selectedParentCat && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#800020]">
                    <span>🔒 Automatically Inherited from Root ({selectedParentCat.name}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parentAttributes.length > 0 ? (
                      parentAttributes.map((pattr) => (
                        <span
                          key={pattr}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 text-gray-800 rounded-xs text-[11px] font-medium shadow-2xs"
                        >
                          <span className="text-amber-600 font-bold">✓</span>
                          <span>{pattr}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-500 italic">
                        Parent category has no base attributes defined.
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-gray-500">
                    These are stored in the root collection and will automatically appear in all products under this subcategory. You do not need to re-add them.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-gray-800">
                  {watchedParentId
                    ? "✨ Specialized Subcategory Attributes (Unique to this craft/weave)"
                    : "🏛️ Common Root Category Attributes"}
                </label>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {watchedParentId
                    ? "Add only extra specifications unique to this subcategory (e.g. Pallu Motif, Zari Purity, Top Cut)."
                    : "Common specifications shared by all products and subcategories in this collection."}
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={attrInput}
                  onChange={(e) => setAttrInput(e.target.value)}
                  onKeyDown={handleAddAttribute}
                  placeholder={
                    watchedParentId
                      ? "Type subcategory-specific attribute (e.g. Pallu Motif, Silk Mark) and press Enter..."
                      : "Type common category attribute (e.g. Fabric, Occasion, Wash Care) and press Enter..."
                  }
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttribute}
                  className="shrink-0 cursor-pointer"
                >
                  Add Tag
                </Button>
              </div>

              {/* Quick-Add Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10.5px] text-gray-400 font-semibold">Quick Chips:</span>
                {UNIVERSAL_QUICK_CHIPS.map((chip) => {
                  const isInherited = parentAttributes.some(
                    (a) => a.toLowerCase().trim() === chip.toLowerCase().trim()
                  );
                  const isAdded = attributes.some(
                    (a) => a.toLowerCase().trim() === chip.toLowerCase().trim()
                  );

                  return (
                    <button
                      key={chip}
                      type="button"
                      disabled={isInherited || isAdded}
                      onClick={() => handleAddQuickChip(chip)}
                      className={`text-[10.5px] px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                        isInherited
                          ? "bg-amber-100/50 text-amber-800 border-amber-200 opacity-60 cursor-not-allowed"
                          : isAdded
                          ? "bg-gray-200 text-gray-500 border-gray-300 opacity-60 cursor-not-allowed"
                          : "bg-gray-100 hover:bg-[#800020]/10 hover:text-[#800020] border-gray-200"
                      }`}
                      title={
                        isInherited
                          ? `Already inherited from ${selectedParentCat?.name}`
                          : isAdded
                          ? "Already added"
                          : "Click to add"
                      }
                    >
                      {isInherited ? `✓ ${chip} (Inherited)` : `+ ${chip}`}
                    </button>
                  );
                })}
              </div>

              {/* Tag Badges Container */}
              <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2.5 bg-gray-50 border border-gray-200 rounded-xs">
                {attributes.length === 0 ? (
                  <span className="text-gray-400 text-xs italic">
                    {watchedParentId
                      ? "No extra specialized attributes added. (All root attributes above will still apply)."
                      : "No attribute tags defined yet. Use the input box or click quick chips above."}
                  </span>
                ) : (
                  attributes.map((attr) => (
                    <span
                      key={attr}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#800020]/30 text-[#800020] font-semibold rounded-xs text-xs shadow-2xs"
                    >
                      <span>{attr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(attr)}
                        className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X size={12} />
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
                disabled={isSavingCategory}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSavingCategory}
                isLoading={isSavingCategory}
              >
                {isSavingCategory
                  ? editingCategory
                    ? "Saving Changes..."
                    : "Creating Category..."
                  : editingCategory
                  ? "Save Changes"
                  : "Create Category"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Category"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs">
              <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              <span>
                Are you sure you want to delete category <strong>{deleteTarget?.name}</strong>?
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={deleteCategoryMutation.isPending}
                onClick={handleConfirmDelete}
              >
                Delete Category
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
