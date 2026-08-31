import apiClient from "./client.js";

export const categoryApi = {
  // 1. Fetch all categories (Public / Admin)
  getAllCategories: async () => {
    const response = await apiClient.get("/api/v1/catalog/categories");
    return response.data;
  },

  // 2. Fetch main/parent categories (parentId == null)
  getMainCategories: async () => {
    const response = await apiClient.get("/api/v1/catalog/categories/main");
    return response.data;
  },

  // 3. Fetch subcategories by parent ID
  getSubcategories: async (parentId) => {
    const params = parentId ? { parentId } : {};
    const response = await apiClient.get("/api/v1/catalog/categories/subcategories", { params });
    return response.data;
  },

  // 4. Admin: Create Category / Subcategory
  createCategory: async (categoryData) => {
    const response = await apiClient.post("/api/v1/admin/categories", categoryData);
    return response.data;
  },

  // 5. Admin: Update Category / Subcategory
  updateCategory: async (id, categoryData) => {
    const response = await apiClient.put(`/api/v1/admin/categories/${id}`, categoryData);
    return response.data;
  },

  // 6. Admin: Delete Category
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/api/v1/admin/categories/${id}`);
    return response.data;
  },

  // 7. Admin: Upload Category Banner / Thumbnail Image
  uploadCategoryImage: async (id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post(`/api/v1/admin/categories/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default categoryApi;
