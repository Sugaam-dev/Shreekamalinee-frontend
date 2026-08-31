import client from "./client.js";

const contactApi = {
  /**
   * Submit a public customer inquiry to PostgreSQL
   * @param {Object} data - { name, email, phone, subject, message }
   */
  submitContactMessage: async (data) => {
    const res = await client.post("/api/v1/contact", data);
    return res.data;
  },

  /**
   * Admin: Get all customer contact inquiries
   */
  getAdminInquiries: async () => {
    const res = await client.get("/api/v1/admin/contact");
    return res.data;
  },

  /**
   * Admin: Update inquiry status (NEW, IN_PROGRESS, RESOLVED, ARCHIVED)
   */
  updateInquiryStatus: async (id, status) => {
    const res = await client.put(`/api/v1/admin/contact/${id}/status`, { status });
    return res.data;
  },
};

export default contactApi;
