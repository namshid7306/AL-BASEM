import { expenseService } from "../services/expenseService.js";

export const expenseController = {
  getExpenses: async (req, res, next) => {
    try {
      const result = await expenseService.getExpenses(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createExpense: async (req, res, next) => {
    try {
      const expense = await expenseService.createExpense(req.body);
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  },

  deleteExpense: async (req, res, next) => {
    try {
      const result = await expenseService.deleteExpense(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
