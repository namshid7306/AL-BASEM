import { settingsService } from "../services/settingsService.js";

export const settingsController = {
  getSettings: async (req, res, next) => {
    try {
      const settings = await settingsService.getSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const settings = await settingsService.updateSettings(req.body);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }
};
