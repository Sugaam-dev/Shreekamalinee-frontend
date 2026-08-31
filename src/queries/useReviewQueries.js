import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import reviewApi from "../api/reviewApi.js";

export const REVIEW_KEYS = {
  product: (productId) => ["reviews", "product", productId],
};

export function useProductReviewsQuery(productId) {
  return useQuery({
    queryKey: REVIEW_KEYS.product(productId),
    queryFn: () => reviewApi.getProductReviews(productId),
    enabled: !!productId,
  });
}

export function useAddAdminReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, reviewData }) =>
      reviewApi.addAdminReview(productId, reviewData),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.product(productId) });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteAdminReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, reviewId }) =>
      reviewApi.deleteAdminReview(reviewId),
    onSuccess: (_, { productId }) => {
      if (productId) {
        queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.product(productId) });
        queryClient.invalidateQueries({ queryKey: ["product", productId] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    },
  });
}

export function useAddCustomerReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, reviewData }) =>
      reviewApi.addCustomerReview(productId, reviewData),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.product(productId) });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteCustomerReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, reviewId }) =>
      reviewApi.deleteCustomerReview(productId, reviewId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.product(productId) });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
