import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import categoryApi from "../api/categoryApi.js";

export const CATEGORY_KEYS = {
  all: ["categories"],
  main: ["categories", "main"],
  subcategories: (parentId) => ["categories", "subcategories", parentId],
};

// 1. Fetch all categories
export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: categoryApi.getAllCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}

// 2. Fetch main root categories
export function useMainCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORY_KEYS.main,
    queryFn: categoryApi.getMainCategories,
    staleTime: 1000 * 60 * 10,
  });
}

// 3. Fetch subcategories for a given parent
export function useSubcategoriesQuery(parentId) {
  return useQuery({
    queryKey: CATEGORY_KEYS.subcategories(parentId),
    queryFn: () => categoryApi.getSubcategories(parentId),
    enabled: !!parentId,
  });
}

// 4. Create Category Mutation
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.main });
    },
  });
}

// 5. Update Category Mutation
export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.main });
    },
  });
}

// 6. Delete Category Mutation
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.main });
    },
  });
}

// 7. Upload Category Image Mutation
export function useUploadCategoryImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }) => categoryApi.uploadCategoryImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.main });
    },
  });
}
