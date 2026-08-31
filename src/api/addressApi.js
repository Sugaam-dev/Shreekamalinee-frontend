import apiClient from "./client.js";

export const addressApi = {
  // 1. Fetch all customer saved addresses
  getAddresses: async () => {
    const response = await apiClient.get("/api/v1/addresses");
    return response.data;
  },

  // 2. Add new shipping address
  addAddress: async (addressData) => {
    const response = await apiClient.post("/api/v1/addresses", addressData);
    return response.data;
  },

  // 3. Update existing shipping address
  updateAddress: async (addressId, addressData) => {
    const response = await apiClient.put(`/api/v1/addresses/${addressId}`, addressData);
    return response.data;
  },

  // 4. Delete shipping address
  deleteAddress: async (addressId) => {
    const response = await apiClient.delete(`/api/v1/addresses/${addressId}`);
    return response.data;
  },

  // 5. Set default shipping address
  setDefaultAddress: async (addressId) => {
    const response = await apiClient.put(`/api/v1/addresses/${addressId}/default`);
    return response.data;
  },
};

export default addressApi;

