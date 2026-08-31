import apiClient from "./client.js";

export const customerApi = {
  // 1. Search and list patrons / users (Admin)
  searchUsers: async (query = "") => {
    const params = query ? { query } : {};
    const response = await apiClient.get("/api/v1/admin/users", { params });
    return response.data;
  },

  // 2. Enable / Disable patron account status (Admin)
  updateUserStatus: async (userId, enabled) => {
    const response = await apiClient.patch(`/api/v1/admin/users/${userId}/status`, null, {
      params: { enabled },
    });
    return response.data;
  },
};

export default customerApi;
