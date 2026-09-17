import apiClient from "./apiClient";

export const dashboardApi = {
  getDashboardData: async (period = "month") => {
    try {
      const res = await apiClient.get("/dashboard", { params: { period } });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
