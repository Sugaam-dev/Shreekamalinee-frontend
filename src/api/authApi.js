import apiClient from "./client.js";

export const authApi = {
  // 1. Password Login (Both Admin and Customer)
  login: async (credentials) => {
    const response = await apiClient.post("/api/v1/auth/login", credentials);
    return response.data;
  },

  // 2. Customer Registration (Sends 6-digit OTP to email)
  register: async (userData) => {
    const response = await apiClient.post("/api/v1/auth/register", userData);
    return response.data;
  },

  // 3. Verify OTP & Activate Account
  verifyOtp: async (data) => {
    const response = await apiClient.post("/api/v1/auth/verify-otp", data);
    return response.data;
  },

  // 4. Google SSO Authenticate
  googleAuthenticate: async (idToken) => {
    const payload =
      typeof idToken === "object" ? idToken : { googleIdToken: idToken, idToken };
    const response = await apiClient.post("/api/v1/auth/google-authenticate", payload);
    return response.data;
  },


  // 5. Forgot Password (Dispatches Reset OTP)
  forgotPassword: async (data) => {
    const response = await apiClient.post("/api/v1/auth/forgot-password", data);
    return response.data;
  },

  // 6. Reset Password with OTP
  resetPassword: async (data) => {
    const response = await apiClient.post("/api/v1/auth/reset-password", data);
    return response.data;
  },

  // 7. Set / Update Password for Logged-In User
  setPassword: async (data) => {
    const response = await apiClient.post("/api/v1/auth/set-password", data);
    return response.data;
  },

  // 8. Hydrate Current Session (Runs on page load / F5 refresh)
  getMe: async () => {
    const response = await apiClient.get("/api/v1/auth/me");
    return response.data;
  },

  // 9. Get Detailed Customer Profile
  getProfile: async () => {
    const response = await apiClient.get("/api/v1/users/me");
    return response.data;
  },

  // 10. Update Customer Profile
  updateProfile: async (data) => {
    const response = await apiClient.patch("/api/v1/users/me", data);
    return response.data;
  },

  // 11. Silent Token Refresh
  refreshToken: async () => {
    const response = await apiClient.post("/api/v1/auth/refresh-token");
    return response.data;
  },

  // 12. Logout (Clears HttpOnly cookies & invalidates session)
  logout: async () => {
    const response = await apiClient.post("/api/v1/auth/logout");
    return response.data;
  },
};

export default authApi;
