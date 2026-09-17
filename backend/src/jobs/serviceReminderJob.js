import { Service } from "../models/Service.js";
import { notificationService } from "../services/notificationService.js";
import { env } from "../config/env.js";
import { formatDubaiDateTime } from "../utils/timezone.js";
import { logger } from "../utils/logger.js";

export const runServiceReminderScan = async () => {
  try {
    const now = new Date();
    const reminderHours = env.SERVICE_REMINDER_HOURS || 24;
    // Allow a 1-hour lookahead buffer to cover hourly cron frequency seamlessly
    const windowEnd = new Date(now.getTime() + (reminderHours + 1) * 60 * 60 * 1000);

    // Scan for UPCOMING services within the reminder window
    const upcomingServices = await Service.find({
      status: "UPCOMING",
      isDeleted: false,
      scheduledDate: { $gte: now, $lte: windowEnd }
    });

    let dispatchedCount = 0;

    for (const service of upcomingServices) {
      const scheduledStr = formatDubaiDateTime(service.scheduledDate);
      const businessKey = `service_rem_${service._id}_${service.scheduledDate.toISOString()}`;

      const notif = await notificationService.createNotification({
        title: `Upcoming Service Reminder: ${service.serviceNumber}`,
        message: `${service.serviceType} for ${service.customerName} is scheduled for ${scheduledStr}.`,
        type: "service",
        link: `/services/${service._id}`,
        entityId: service._id.toString(),
        entityType: "service",
        businessKey
      });

      if (notif) {
        service.reminderSentAt = new Date();
        await service.save().catch((e) => logger.debug("Service reminder timestamp save error", e));
        dispatchedCount++;
      }
    }

    if (dispatchedCount > 0) {
      logger.info(`Dispatched ${dispatchedCount} upcoming service reminders.`);
    }
  } catch (err) {
    logger.error("Error executing service reminder job", err);
  }
};
