import { reportService } from "../services/reportService.js";

export const reportController = {
  getReports: async (req, res, next) => {
    try {
      const result = await reportService.getReports(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
