import apiClient from "./apiClient";

export const customerApi = {
  getCustomers: async (params = {}) => {
    try {
      const res = await apiClient.get("/customers", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  getCustomerById: async (id) => {
    try {
      const res = await apiClient.get(`/customers/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const res = await apiClient.post("/customers", customerData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const res = await apiClient.put(`/customers/${id}`, customerData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const res = await apiClient.delete(`/customers/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
