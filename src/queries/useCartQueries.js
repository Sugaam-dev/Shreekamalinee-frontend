import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import cartApi from "../api/cartApi.js";

export const CART_KEYS = {
  all: ["cart"],
};

// 1. Fetch user's cart from server
export function useCartQuery(enabled = true) {
  return useQuery({
    queryKey: CART_KEYS.all,
    queryFn: () => cartApi.getCart(),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// 2. Add item to cart
export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity = 1 }) =>
      cartApi.addItem({ variantId, quantity }),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_KEYS.all, updatedCart);
    },
  });
}

// 3. Update cart item quantity
export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }) =>
      cartApi.updateItemQty({ itemId, quantity }),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_KEYS.all, updatedCart);
    },
  });
}

// 4. Remove item from cart
export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId) => cartApi.removeItem(itemId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_KEYS.all, updatedCart);
    },
  });
}

// 5. Clear entire cart
export function useClearCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.setQueryData(CART_KEYS.all, { items: [], totalAmount: 0 });
    },
  });
}
