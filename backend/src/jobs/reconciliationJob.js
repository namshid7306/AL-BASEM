import { reconcileAllCustomers } from "../utils/reconciliation.js";
import { logger } from "../utils/logger.js";

export const runReconciliationJob = async () => {
  try {
    await reconcileAllCustomers();
  } catch (err) {
    logger.error("Error during nightly customer financial reconciliation", err);
  }
};
