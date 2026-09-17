import apiClient from "./apiClient";

export const reportApi = {
  getReports: async (params = {}) => {
    try {
      const res = await apiClient.get("/reports", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
