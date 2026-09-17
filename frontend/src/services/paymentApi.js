import apiClient from "./apiClient";

export const paymentApi = {
  getPayments: async (params = {}) => {
    try {
      const res = await apiClient.get("/payments", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  recordPayment: async (paymentData, idempotencyKey = null) => {
    try {
      const config = {};
      if (idempotencyKey) {
        config.headers = {
          "Idempotency-Key": idempotencyKey
        };
      }
      const res = await apiClient.post("/payments", paymentData, config);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
