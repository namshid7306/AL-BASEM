import { paymentService } from "../services/paymentService.js";

export const paymentController = {
  getPayments: async (req, res, next) => {
    try {
      const result = await paymentService.getPayments(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  recordPayment: async (req, res, next) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"] || null;
      const payment = await paymentService.recordPayment(req.body, idempotencyKey);
      res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  }
};
