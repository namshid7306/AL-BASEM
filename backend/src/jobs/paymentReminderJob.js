import { Invoice } from "../models/Invoice.js";
import { notificationService } from "../services/notificationService.js";
import { env } from "../config/env.js";
import { getDubaiDateString, getDubaiDayBoundaries, formatDubaiDate } from "../utils/timezone.js";
import { logger } from "../utils/logger.js";

export const runPaymentReminderScan = async () => {
  try {
    const now = new Date();
    const reminderDays = env.PAYMENT_REMINDER_DAYS || 3;
    const { startOfDay: todayStart, endOfDay: todayEnd } = getDubaiDayBoundaries(now);

    const reminderWindowEnd = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

    // Query active invoices with balance > 0 and status UNPAID or PARTIAL
    const pendingInvoices = await Invoice.find({
      isDeleted: false,
      status: { $in: ["UNPAID", "PARTIAL"] },
      balanceAmount: { $gt: 0 },
      dueDate: { $gte: todayStart, $lte: reminderWindowEnd }
    });

    let countDueToday = 0;
    let countDue3Days = 0;

    for (const invoice of pendingInvoices) {
      const dueDateStr = formatDubaiDate(invoice.dueDate);
      const dueDateDubaiStr = getDubaiDateString(invoice.dueDate);
      const formattedBalance = Number(invoice.balanceAmount).toLocaleString("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // Check if due today in Asia/Dubai
      if (invoice.dueDate >= todayStart && invoice.dueDate <= todayEnd) {
        const businessKey = `payment_due_today_${invoice._id}_${dueDateDubaiStr}`;
        const notif = await notificationService.createNotification({
          title: `Payment Due Today: ${invoice.invoiceNumber}`,
          message: `AED ${formattedBalance} payment for ${invoice.customerName} (Invoice ${invoice.invoiceNumber}) is due today.`,
          type: "payment",
          link: `/invoices/${invoice._id}`,
          entityId: invoice._id.toString(),
          entityType: "invoice",
          businessKey
        });
        if (notif) countDueToday++;
      } else {
        // Approaching due date reminder (e.g. 3 days before)
        const businessKey = `payment_due_3_${invoice._id}_${dueDateDubaiStr}`;
        const notif = await notificationService.createNotification({
          title: `Payment Due Soon: ${invoice.invoiceNumber}`,
          message: `AED ${formattedBalance} payment for ${invoice.customerName} (Invoice ${invoice.invoiceNumber}) is due on ${dueDateStr}.`,
          type: "payment",
          link: `/invoices/${invoice._id}`,
          entityId: invoice._id.toString(),
          entityType: "invoice",
          businessKey
        });
        if (notif) countDue3Days++;
      }
    }

    const totalCreated = countDueToday + countDue3Days;
    if (totalCreated > 0) {
      logger.info(
        `Dispatched payment reminders for ${totalCreated} invoices (${countDueToday} due today, ${countDue3Days} due soon).`
      );
    }
  } catch (err) {
    logger.error("Error executing payment reminder job", err);
  }
};
