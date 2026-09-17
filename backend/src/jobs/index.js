import cron from "node-cron";
import { runServiceReminderScan } from "./serviceReminderJob.js";
import { runContractExpiryScan } from "./contractExpiryJob.js";
import { runPaymentReminderScan } from "./paymentReminderJob.js";
import { runInvoiceOverdueScan } from "./invoiceOverdueJob.js";
import { runReconciliationJob } from "./reconciliationJob.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let isJobsInitialized = false;

export const initBackgroundJobs = () => {
  // Prevent duplicate initialization
  if (isJobsInitialized) {
    logger.debug("Background jobs already initialized. Skipping duplicate setup.");
    return;
  }

  // Guard against duplicate cron scheduling in PM2 cluster mode
  if (process.env.NODE_APP_INSTANCE !== undefined && process.env.NODE_APP_INSTANCE !== "0") {
    logger.info(`Skipping cron job initialization on secondary PM2 cluster worker (instance: ${process.env.NODE_APP_INSTANCE})`);
    return;
  }

  const timezone = env.TIMEZONE || "Asia/Dubai";
  logger.info(`Initializing background cron jobs in timezone: ${timezone}`);

  // 1. Hourly Service Reminder Job (at minute 0 of every hour)
  cron.schedule("0 * * * *", async () => {
    try {
      logger.debug("Executing scheduled hourly service reminder scan...");
      await runServiceReminderScan();
    } catch (err) {
      logger.error("Error in hourly service reminder cron task", err);
    }
  }, { timezone });

  // 2. Daily Contract Expiry Scan (at 08:00 AM)
  cron.schedule("0 8 * * *", async () => {
    try {
      logger.info("Executing scheduled daily contract expiry scan...");
      await runContractExpiryScan();
    } catch (err) {
      logger.error("Error in daily contract expiry cron task", err);
    }
  }, { timezone });

  // 3. Daily Payment Due Scan (at 08:15 AM)
  cron.schedule("15 8 * * *", async () => {
    try {
      logger.info("Executing scheduled daily payment due scan...");
      await runPaymentReminderScan();
    } catch (err) {
      logger.error("Error in daily payment reminder cron task", err);
    }
  }, { timezone });

  // 4. Daily Invoice Overdue Scan (at 08:30 AM)
  cron.schedule("30 8 * * *", async () => {
    try {
      logger.info("Executing scheduled daily invoice overdue scan...");
      await runInvoiceOverdueScan();
    } catch (err) {
      logger.error("Error in daily invoice overdue cron task", err);
    }
  }, { timezone });

  // 5. Nightly Financial Reconciliation Job (at 03:00 AM)
  cron.schedule("0 3 * * *", async () => {
    try {
      logger.info("Executing scheduled nightly customer reconciliation job...");
      await runReconciliationJob();
    } catch (err) {
      logger.error("Error in nightly reconciliation cron task", err);
    }
  }, { timezone });

  isJobsInitialized = true;
  logger.info("✅ All background cron jobs scheduled successfully.");
};
