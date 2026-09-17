import apiClient from "./apiClient";

export const searchApi = {
  search: async (q) => {
    try {
      const res = await apiClient.get("/search", { params: { q } });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
