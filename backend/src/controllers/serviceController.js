import { serviceService } from "../services/serviceService.js";

export const serviceController = {
  getServices: async (req, res, next) => {
    try {
      const result = await serviceService.getServices(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getServiceById: async (req, res, next) => {
    try {
      const result = await serviceService.getServiceById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createService: async (req, res, next) => {
    try {
      const service = await serviceService.createService(req.body);
      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  },

  updateService: async (req, res, next) => {
    try {
      const service = await serviceService.updateService(req.params.id, req.body);
      res.json(service);
    } catch (err) {
      next(err);
    }
  },

  deleteService: async (req, res, next) => {
    try {
      const result = await serviceService.deleteService(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
