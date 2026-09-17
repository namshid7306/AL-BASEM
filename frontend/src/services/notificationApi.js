import apiClient from "./apiClient";

export const notificationApi = {
  getNotifications: async () => {
    try {
      const res = await apiClient.get("/notifications");
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
