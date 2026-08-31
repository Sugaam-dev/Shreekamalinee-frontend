import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import productApi from "../api/productApi.js";

export const PRODUCT_KEYS = {
  all: ["products"],
  list: (filters) => ["products", "list", filters],
  detail: (id) => ["products", "detail", id],
};

// 1. Hook for Fetching Product List
export function useProductsQuery(filters = {}) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => productApi.getProducts(filters),
    staleTime: 1000 * 5, // 5 seconds fresh
    refetchOnWindowFocus: true,
  });
}

// 2. Hook for Fetching Single Product Detail
export function useProductQuery(id) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 15000, // 15s live background inventory poll
    refetchOnWindowFocus: true,
  });
}

// 3. Create Product Mutation
export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// 4. Update Product Mutation
export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productApi.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(PRODUCT_KEYS.detail(updatedProduct.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// 5. Delete Product Mutation
export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

// 6. Upload Product Image Mutation
export function useUploadProductImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }) => productApi.uploadProductImage(id, file),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(PRODUCT_KEYS.detail(updatedProduct.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

// 7. Delete Product Image Mutation
export function useDeleteProductImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imageUrl }) => productApi.deleteProductImage(id, imageUrl),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(PRODUCT_KEYS.detail(updatedProduct.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

// 8. Add Variant Mutation
export function useAddVariantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, variantData }) => productApi.addVariant(productId, variantData),
    onSuccess: (newVariant, { productId }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

// 9. Update Variant Stock Mutation (Live In-Place Instant Stock Adjustments)
export function useUpdateVariantStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, stock }) => productApi.updateVariantStock(variantId, stock),
    onSuccess: (updatedVariant, { variantId, stock }) => {
      // Invalidate all product queries so all storefront & admin pages re-sync immediately
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin", "stats"] });
    },
  });
}

// 10. Delete Variant Mutation
export function useDeleteVariantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId) => productApi.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}
