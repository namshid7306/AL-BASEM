import { Contract } from "../models/Contract.js";
import { notificationService } from "../services/notificationService.js";
import { env } from "../config/env.js";
import { getDubaiDateString, formatDubaiDate } from "../utils/timezone.js";
import { logger } from "../utils/logger.js";

export const runContractExpiryScan = async () => {
  try {
    const now = new Date();
    const reminderDays = env.CONTRACT_REMINDER_DAYS || 30;
    const finalReminderDays = env.CONTRACT_FINAL_REMINDER_DAYS || 7;

    const reminderWindowEnd = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

    // Query active, non-deleted contracts expiring within lookahead or already expired
    const activeContracts = await Contract.find({
      status: "ACTIVE",
      isDeleted: false,
      endDate: { $lte: reminderWindowEnd }
    });

    let count30 = 0;
    let count7 = 0;
    let countExpired = 0;

    for (const contract of activeContracts) {
      const expiryDateStr = formatDubaiDate(contract.endDate);
      const endDateDubaiStr = getDubaiDateString(contract.endDate);
      const timeDiff = contract.endDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));

      if (timeDiff <= 0) {
        // 1. Contract Expired Alert
        const businessKey = `contract_expired_${contract._id}_${endDateDubaiStr}`;
        const notif = await notificationService.createNotification({
          title: `Contract Expired: ${contract.contractNumber}`,
          message: `${contract.planName} for ${contract.customerName} expired on ${expiryDateStr}.`,
          type: "contract",
          link: `/contracts/${contract._id}`,
          entityId: contract._id.toString(),
          entityType: "contract",
          businessKey
        });

        if (notif) countExpired++;
      } else if (daysUntilExpiry <= finalReminderDays) {
        // 2. 7-Day Expiry Reminder
        const businessKey = `contract_exp_7_${contract._id}_${endDateDubaiStr}`;
        const notif = await notificationService.createNotification({
          title: `Contract Expiring Soon (7 Days): ${contract.contractNumber}`,
          message: `${contract.planName} for ${contract.customerName} expires in 7 days on ${expiryDateStr}.`,
          type: "contract",
          link: `/contracts/${contract._id}`,
          entityId: contract._id.toString(),
          entityType: "contract",
          businessKey
        });

        if (notif) count7++;
      } else if (daysUntilExpiry <= reminderDays) {
        // 3. 30-Day Expiry Reminder
        const businessKey = `contract_exp_30_${contract._id}_${endDateDubaiStr}`;
        const notif = await notificationService.createNotification({
          title: `Contract Expiring Soon: ${contract.contractNumber}`,
          message: `${contract.planName} for ${contract.customerName} will expire in 30 days on ${expiryDateStr}.`,
          type: "contract",
          link: `/contracts/${contract._id}`,
          entityId: contract._id.toString(),
          entityType: "contract",
          businessKey
        });

        if (notif) {
          contract.renewalReminderSentAt = new Date();
          await contract.save().catch((e) => logger.debug("Contract save error", e));
          count30++;
        }
      }
    }

    const totalCreated = count30 + count7 + countExpired;
    if (totalCreated > 0) {
      logger.info(
        `Contract expiry scan dispatched ${totalCreated} alerts (${count30} 30-day, ${count7} 7-day, ${countExpired} expired).`
      );
    }
  } catch (err) {
    logger.error("Error executing contract expiry job", err);
  }
};
