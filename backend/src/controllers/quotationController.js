import { quotationService } from "../services/quotationService.js";

export const quotationController = {
  getQuotations: async (req, res, next) => {
    try {
      const result = await quotationService.getQuotations(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getQuotationById: async (req, res, next) => {
    try {
      const result = await quotationService.getQuotationById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createQuotation: async (req, res, next) => {
    try {
      const quotation = await quotationService.createQuotation(req.body);
      res.status(201).json(quotation);
    } catch (err) {
      next(err);
    }
  },

  convertToInvoice: async (req, res, next) => {
    try {
      const result = await quotationService.convertToInvoice(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
