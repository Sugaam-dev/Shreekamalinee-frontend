import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends and receives HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer token from localStorage if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("shreekamalinee_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only exclude explicit auth mutation flows to avoid recursive loops
    const noRefreshEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/google-authenticate",
      "/auth/refresh-token",
      "/auth/logout",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-otp",
    ];

    const isNoRefreshEndpoint = noRefreshEndpoints.some((ep) =>
      originalRequest?.url?.includes(ep)
    );



    if (error.response?.status === 401 && !originalRequest._retry && !isNoRefreshEndpoint) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data?.token;
        if (newToken && typeof window !== "undefined") {
          localStorage.setItem("shreekamalinee_token", newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
        }

        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("shreekamalinee_token");
          localStorage.removeItem("shreekamalinee_user_cache");
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

