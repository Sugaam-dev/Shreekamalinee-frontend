import apiClient from "./client.js";

export const wishlistApi = {
  // 1. Fetch user wishlist
  getWishlist: async () => {
    const response = await apiClient.get("/api/v1/wishlist");
    return response.data;
  },

  // 2. Add product to wishlist
  addItem: async (productId) => {
    const response = await apiClient.post(`/api/v1/wishlist/${productId}`);
    return response.data;
  },

  // 3. Remove product from wishlist
  removeItem: async (productId) => {
    const response = await apiClient.delete(`/api/v1/wishlist/${productId}`);
    return response.data;
  },

  // 4. Check if product is wishlisted
  isWishlisted: async (productId) => {
    const response = await apiClient.get(`/api/v1/wishlist/${productId}/status`);
    return response.data;
  },

  // 5. Move product from wishlist to cart
  moveToCart: async (productId, variantId = null, quantity = 1) => {
    const params = {};
    if (quantity) params.quantity = quantity;
    if (variantId && typeof variantId === "string" && variantId !== "null" && variantId.trim().length > 0) {
      params.variantId = variantId;
    }
    const response = await apiClient.post(`/api/v1/wishlist/${productId}/move-to-cart`, null, {
      params,
    });
    return response.data;
  },
};

export default wishlistApi;

