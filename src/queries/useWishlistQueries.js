import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import wishlistApi from "../api/wishlistApi.js";

export const WISHLIST_KEYS = {
  all: ["wishlist"],
  status: (productId) => ["wishlist", "status", productId],
};

// 1. Fetch user's wishlist from server
export function useWishlistQuery(enabled = true) {
  return useQuery({
    queryKey: WISHLIST_KEYS.all,
    queryFn: () => wishlistApi.getWishlist(),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

// 2. Add product to wishlist
export function useAddToWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => wishlistApi.addItem(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
      queryClient.setQueryData(WISHLIST_KEYS.status(productId), true);
    },
  });
}

// 3. Remove product from wishlist
export function useRemoveFromWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => wishlistApi.removeItem(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
      queryClient.setQueryData(WISHLIST_KEYS.status(productId), false);
    },
  });
}

// 4. Check if product is wishlisted
export function useIsWishlistedQuery(productId, enabled = true) {
  return useQuery({
    queryKey: WISHLIST_KEYS.status(productId),
    queryFn: () => wishlistApi.isWishlisted(productId),
    enabled: enabled && !!productId,
  });
}
