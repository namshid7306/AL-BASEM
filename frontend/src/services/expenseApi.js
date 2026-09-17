import apiClient from "./apiClient";

export const expenseApi = {
  getExpenses: async (params = {}) => {
    try {
      const res = await apiClient.get("/expenses", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  createExpense: async (expenseData) => {
    try {
      const res = await apiClient.post("/expenses", expenseData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  deleteExpense: async (id) => {
    try {
      const res = await apiClient.delete(`/expenses/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
