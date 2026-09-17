import { notificationService } from "../services/notificationService.js";

export const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const result = await notificationService.getNotifications();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const result = await notificationService.markAsRead(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
