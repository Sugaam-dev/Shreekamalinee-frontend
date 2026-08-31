import apiClient from "./client.js";

export const cartApi = {
  // 1. Fetch active user's cart
  getCart: async () => {
    const response = await apiClient.get("/api/v1/cart");
    return response.data;
  },

  // 2. Add product variant to cart
  addItem: async ({ variantId, quantity = 1 }) => {
    const response = await apiClient.post("/api/v1/cart/items", {
      variantId,
      quantity,
    });
    return response.data;
  },

  // 3. Update quantity of a cart item
  updateItemQty: async ({ itemId, quantity }) => {
    const response = await apiClient.put(
      `/api/v1/cart/items/${itemId}?quantity=${quantity}`
    );
    return response.data;
  },

  // 4. Remove single item from cart
  removeItem: async (itemId) => {
    const response = await apiClient.delete(`/api/v1/cart/items/${itemId}`);
    return response.data;
  },

  // 5. Clear entire cart
  clearCart: async () => {
    const response = await apiClient.delete("/api/v1/cart");
    return response.data;
  },
};

export default cartApi;

