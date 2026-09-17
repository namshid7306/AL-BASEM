import { contractService } from "../services/contractService.js";

export const contractController = {
  getContracts: async (req, res, next) => {
    try {
      const result = await contractService.getContracts(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getContractById: async (req, res, next) => {
    try {
      const result = await contractService.getContractById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createContract: async (req, res, next) => {
    try {
      const contract = await contractService.createContract(req.body);
      res.status(201).json(contract);
    } catch (err) {
      next(err);
    }
  },

  renewContract: async (req, res, next) => {
    try {
      const contract = await contractService.renewContract(req.params.id, req.body);
      res.status(201).json(contract);
    } catch (err) {
      next(err);
    }
  },

  updateContractStatus: async (req, res, next) => {
    try {
      const contract = await contractService.updateContractStatus(req.params.id, req.body.status);
      res.json(contract);
    } catch (err) {
      next(err);
    }
  }
};
