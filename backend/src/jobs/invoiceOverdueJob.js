import { Invoice } from "../models/Invoice.js";
import { notificationService } from "../services/notificationService.js";
import { getDubaiDateString, getDubaiDayBoundaries } from "../utils/timezone.js";
import { logger } from "../utils/logger.js";

export const runInvoiceOverdueScan = async () => {
  try {
    const now = new Date();
    const { startOfDay: todayStart } = getDubaiDayBoundaries(now);

    const eligibleInvoices = await Invoice.find({
      isDeleted: false,
      status: { $in: ["UNPAID", "PARTIAL"] },
      balanceAmount: { $gt: 0 },
      dueDate: { $lt: todayStart }
    });

    let notifiedCount = 0;

    for (const invoice of eligibleInvoices) {
      invoice.status = "OVERDUE";
      await invoice.save();

      const dueDateDubaiStr = getDubaiDateString(invoice.dueDate);
      const formattedBalance = Number(invoice.balanceAmount).toLocaleString("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const businessKey = `payment_overdue_${invoice._id}_${dueDateDubaiStr}`;

      const notif = await notificationService.createNotification({
        title: `Payment Overdue: ${invoice.invoiceNumber}`,
        message: `Invoice ${invoice.invoiceNumber} for ${invoice.customerName} is overdue with an outstanding balance of AED ${formattedBalance}.`,
        type: "payment",
        link: `/invoices/${invoice._id}`,
        entityId: invoice._id.toString(),
        entityType: "invoice",
        businessKey
      });

      if (notif) notifiedCount++;
    }

    if (eligibleInvoices.length > 0) {
      logger.info(
        `Updated status to OVERDUE for ${eligibleInvoices.length} invoices and dispatched ${notifiedCount} overdue notifications.`
      );
    }
  } catch (err) {
    logger.error("Error updating overdue invoices", err);
  }
};
