import apiClient from "./apiClient";

export const settingsApi = {
  getSettings: async () => {
    try {
      const res = await apiClient.get("/settings");
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const res = await apiClient.put("/settings", settingsData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
