import { customerService } from "../services/customerService.js";

export const customerController = {
  getCustomers: async (req, res, next) => {
    try {
      const result = await customerService.getCustomers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getCustomerById: async (req, res, next) => {
    try {
      const result = await customerService.getCustomerById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createCustomer: async (req, res, next) => {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (err) {
      next(err);
    }
  },

  updateCustomer: async (req, res, next) => {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (err) {
      next(err);
    }
  },

  deleteCustomer: async (req, res, next) => {
    try {
      const result = await customerService.deleteCustomer(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
