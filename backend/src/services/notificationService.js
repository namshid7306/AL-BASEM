import { Notification } from "../models/Notification.js";
import { AppError } from "../middleware/errorHandler.js";

export const notificationService = {
  getNotifications: async () => {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ read: false });
    return { notifications, unreadCount };
  },

  markAsRead: async (id) => {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }
    return { success: true };
  },

  createNotification: async ({ title, message, type, link, entityId, entityType, businessKey, session = null }) => {
    try {
      if (businessKey) {
        const existing = await Notification.findOne({ businessKey }).session(session);
        if (existing) return existing;
      }

      const notification = new Notification({
        title,
        message,
        type: type || "system",
        link: link || "",
        entityId: entityId || null,
        entityType: entityType || null,
        businessKey: businessKey || null
      });

      await notification.save({ session });
      return notification;
    } catch (err) {
      if (err.code === 11000) {
        // Business key already exists
        return null;
      }
      throw err;
    }
  }
};
