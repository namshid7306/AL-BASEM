import apiClient from "./apiClient";

export const quotationApi = {
  getQuotations: async (params = {}) => {
    try {
      const res = await apiClient.get("/quotations", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  getQuotationById: async (id) => {
    try {
      const res = await apiClient.get(`/quotations/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  createQuotation: async (quoteData) => {
    try {
      const res = await apiClient.post("/quotations", quoteData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  convertToInvoice: async (id) => {
    try {
      const res = await apiClient.post(`/quotations/${id}/convert-to-invoice`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
