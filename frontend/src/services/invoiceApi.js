import apiClient from "./apiClient";

export const invoiceApi = {
  getInvoices: async (params = {}) => {
    try {
      const res = await apiClient.get("/invoices", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  getInvoiceById: async (id) => {
    try {
      const res = await apiClient.get(`/invoices/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  createInvoice: async (invoiceData) => {
    try {
      const res = await apiClient.post("/invoices", invoiceData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
