import apiClient from "./apiClient";

export const contractApi = {
  getContracts: async (params = {}) => {
    try {
      const res = await apiClient.get("/contracts", { params });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  getContractById: async (id) => {
    try {
      const res = await apiClient.get(`/contracts/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  createContract: async (contractData) => {
    try {
      const res = await apiClient.post("/contracts", contractData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  renewContract: async (id, renewalData) => {
    try {
      const res = await apiClient.post(`/contracts/${id}/renew`, renewalData);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  },

  updateContractStatus: async (id, status) => {
    try {
      const res = await apiClient.patch(`/contracts/${id}/status`, { status });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message ? new Error(err.response.data.message) : err;
    }
  }
};
