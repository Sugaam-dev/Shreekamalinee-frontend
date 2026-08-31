import apiClient from "./client.js";

export const productApi = {
  // 1. Fetch products with optional filtering & search
  getProducts: async (filters = {}) => {
    const response = await apiClient.get("/api/v1/catalog/products", { params: filters });
    return response.data;
  },

  // 2. Fetch single product by ID
  getProductById: async (id) => {
    const response = await apiClient.get(`/api/v1/catalog/products/${id}`);
    return response.data;
  },

  // 3. Admin: Create Product
  createProduct: async (productData) => {
    const response = await apiClient.post("/api/v1/admin/products", productData);
    return response.data;
  },

  // 4. Admin: Update Product
  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/api/v1/admin/products/${id}`, productData);
    return response.data;
  },

  // 5. Admin: Delete Product
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/api/v1/admin/products/${id}`);
    return response.data;
  },

  // 6. Admin: Upload Product Gallery Image (multipart/form-data)
  uploadProductImage: async (id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post(`/api/v1/admin/products/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 7. Admin: Delete Product Gallery Image
  deleteProductImage: async (id, imageUrl) => {
    const response = await apiClient.delete(`/api/v1/admin/products/${id}/images`, {
      params: { imageUrl },
    });
    return response.data;
  },

  // 8. Admin: Add Variant to Product
  addVariant: async (productId, variantData) => {
    const response = await apiClient.post(`/api/v1/admin/products/${productId}/variants`, variantData);
    return response.data;
  },

  // 9. Admin: Update Variant Stock Units
  updateVariantStock: async (variantId, stock) => {
    const response = await apiClient.put(`/api/v1/admin/variants/${variantId}/stock`, null, {
      params: { stock },
    });
    return response.data;
  },

  // 10. Admin: Delete Variant
  deleteVariant: async (variantId) => {
    const response = await apiClient.delete(`/api/v1/admin/variants/${variantId}`);
    return response.data;
  },
};

export default productApi;
