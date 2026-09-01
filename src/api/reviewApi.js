import apiClient from "./client.js";

export const reviewApi = {
  // 1. Fetch reviews summary for a product
  getProductReviews: async (productId) => {
    const response = await apiClient.get(`/api/v1/catalog/products/${productId}/reviews`);
    const data = response.data;
    if (Array.isArray(data)) {
      const sum = data.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      const avg = data.length > 0 ? Math.round((sum / data.length) * 10) / 10 : 5.0;
      return {
        reviews: data,
        averageRating: avg,
        totalReviews: data.length,
      };
    }
    if (Array.isArray(data?.content)) {
      return {
        reviews: data.content,
        averageRating: data.averageRating || 5.0,
        totalReviews: data.totalElements || data.content.length,
      };
    }
    return data || { reviews: [], averageRating: 0, totalReviews: 0 };
  },

  // 2. Add review as Admin (e.g. offline customer verification)
  addAdminReview: async (productId, reviewData) => {
    const response = await apiClient.post(`/api/v1/admin/products/${productId}/reviews`, reviewData);
    return response.data;
  },

  // 3. Delete review as Admin (Moderation)
  deleteAdminReview: async (reviewId) => {
    const response = await apiClient.delete(`/api/v1/admin/reviews/${reviewId}`);
    return response.data;
  },

  // 4. Add review as Customer
  addCustomerReview: async (productId, reviewData) => {
    const response = await apiClient.post(`/api/v1/catalog/products/${productId}/reviews`, reviewData);
    return response.data;
  },

  // 5. Delete review as Customer
  deleteCustomerReview: async (productId, reviewId) => {
    const response = await apiClient.delete(`/api/v1/catalog/products/${productId}/reviews/${reviewId}`);
    return response.data;
  },
};

export default reviewApi;
