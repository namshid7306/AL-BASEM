import { invoiceService } from "../services/invoiceService.js";

export const invoiceController = {
  getInvoices: async (req, res, next) => {
    try {
      const result = await invoiceService.getInvoices(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getInvoiceById: async (req, res, next) => {
    try {
      const result = await invoiceService.getInvoiceById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createInvoice: async (req, res, next) => {
    try {
      const invoice = await invoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  }
};
