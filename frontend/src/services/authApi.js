import apiClient from "./apiClient";

let inFlightRefreshPromise = null;

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      if (response.data && response.data.token) {
        localStorage.setItem("al_basem_token", response.data.token);
        localStorage.setItem("al_basem_user", JSON.stringify(response.data.user));
        return response.data;
      }
      return response.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("al_basem_token");
      localStorage.removeItem("al_basem_user");
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data.user;
    } catch (err) {
      const storedUser = localStorage.getItem("al_basem_user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  refreshToken: async () => {
    if (inFlightRefreshPromise) {
      return inFlightRefreshPromise;
    }

    inFlightRefreshPromise = (async () => {
      try {
        const response = await apiClient.post("/auth/refresh");
        if (response.data && response.data.token) {
          localStorage.setItem("al_basem_token", response.data.token);
          if (response.data.user) {
            localStorage.setItem("al_basem_user", JSON.stringify(response.data.user));
          }
        }
        return response.data;
      } catch (err) {
        throw err.response?.data?.message ? new Error(err.response.data.message) : err;
      } finally {
        inFlightRefreshPromise = null;
      }
    })();

    return inFlightRefreshPromise;
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
