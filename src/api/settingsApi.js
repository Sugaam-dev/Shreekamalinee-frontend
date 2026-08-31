import apiClient from "./client.js";

export const settingsApi = {
  // 1. Fetch current Store & Banking Configuration
  getBankDetails: async () => {
    const response = await apiClient.get("/api/v1/settings/public");
    return response.data;
  },

  // 2. Dedicated Shipping & Delivery Settings API
  updateShippingSettings: async (shippingData) => {
    const response = await apiClient.put("/api/v1/admin/settings/shipping", shippingData);
    return response.data;
  },

  // 3. Dedicated Top Announcement / Offer Bar API
  updateAnnouncementSettings: async (announcementData) => {
    const response = await apiClient.put("/api/v1/admin/settings/announcement", announcementData);
    return response.data;
  },

  // 4. Dedicated Support & Contact Settings API
  updateContactSettings: async (contactData) => {
    const response = await apiClient.put("/api/v1/admin/settings/contact", contactData);
    return response.data;
  },

  // 5. Dedicated Merchant Banking & UPI Credentials API
  updateBankDetails: async (bankData) => {
    const response = await apiClient.put("/api/v1/admin/settings/banking", bankData);
    return response.data;
  },

  // 6. Upload Merchant UPI QR Code Image
  uploadQrCode: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post("/api/v1/admin/settings/banking/qr-code", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default settingsApi;


