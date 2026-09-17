import apiClient from "./apiClient";

export const serviceApi = {
  getServices: async (params = {}) => {
    try {
      const res = await apiClient.get("/services", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  getServiceById: async (id) => {
    try {
      const res = await apiClient.get(`/services/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  createService: async (serviceData) => {
    try {
      const res = await apiClient.post("/services", serviceData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  updateService: async (id, serviceData) => {
    try {
      const res = await apiClient.put(`/services/${id}`, serviceData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  deleteService: async (id) => {
    try {
      const res = await apiClient.delete(`/services/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
