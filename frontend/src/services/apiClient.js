import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true, // Send HttpOnly refresh cookie with requests
  timeout: 10000
});

// Request interceptor to attach access token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("al_basem_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight refresh token queue state
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

// Response interceptor to handle 401 with automatic token renewal
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on login or refresh failures or if already retried
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      if (
        error.response?.status === 401 &&
        (originalRequest?.url?.includes("/auth/refresh") || originalRequest?._retry)
      ) {
        localStorage.removeItem("al_basem_token");
        localStorage.removeItem("al_basem_user");
        window.dispatchEvent(new Event("auth-expired"));
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    return new Promise((resolve, reject) => {
      apiClient
        .post("/auth/refresh")
        .then(({ data }) => {
          const newToken = data.token;
          localStorage.setItem("al_basem_token", newToken);
          if (data.user) {
            localStorage.setItem("al_basem_user", JSON.stringify(data.user));
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          resolve(apiClient(originalRequest));
        })
        .catch((refreshErr) => {
          processQueue(refreshErr, null);
          localStorage.removeItem("al_basem_token");
          localStorage.removeItem("al_basem_user");
          window.dispatchEvent(new Event("auth-expired"));
          reject(refreshErr);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  }
);

export default apiClient;
