import { dashboardService } from "../services/dashboardService.js";

export const dashboardController = {
  getDashboardData: async (req, res, next) => {
    try {
      const period = req.query.period || "month";
      const result = await dashboardService.getDashboardData(period);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
