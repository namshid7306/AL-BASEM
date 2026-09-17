import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { Service } from "../models/Service.js";
import { roundHalfUp } from "./money.js";
import { logger } from "./logger.js";

export const recalculateCustomerFinancials = async (customerId, session = null) => {
  const custObjectId = typeof customerId === "string" ? new mongoose.Types.ObjectId(customerId) : customerId;

  // 1. Authoritative Total Revenue from active Invoices
  const invoiceAggregation = await Invoice.aggregate([
    { $match: { customerId: custObjectId, isDeleted: false, status: { $ne: "CANCELLED" } } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
  ]).session(session);

  const totalRevenue = roundHalfUp(invoiceAggregation[0]?.totalRevenue || 0);

  // 2. Authoritative Paid Total from completed Payments
  const paymentAggregation = await Payment.aggregate([
    { $match: { customerId: custObjectId, isDeleted: false, status: "COMPLETED" } },
    { $group: { _id: null, paidTotal: { $sum: "$amount" } } }
  ]).session(session);

  const paidTotal = roundHalfUp(paymentAggregation[0]?.paidTotal || 0);

  // 3. Derived Outstanding Balance
  const outstandingBalance = Math.max(0, roundHalfUp(totalRevenue - paidTotal));

  // 4. Services Count & Dates
  const servicesCount = await Service.countDocuments({
    customerId: custObjectId,
    isDeleted: false
  }).session(session);

  const lastService = await Service.findOne({
    customerId: custObjectId,
    status: "COMPLETED",
    isDeleted: false
  })
    .sort({ scheduledDate: -1 })
    .session(session);

  const nextService = await Service.findOne({
    customerId: custObjectId,
    status: "UPCOMING",
    isDeleted: false
  })
    .sort({ scheduledDate: 1 })
    .session(session);

  const updateFields = {
    totalRevenue,
    paidTotal,
    outstandingBalance,
    servicesCount,
    lastServiceDate: lastService?.scheduledDate || null,
    nextServiceDate: nextService?.scheduledDate || null
  };

  await Customer.findByIdAndUpdate(custObjectId, updateFields, { session });

  return updateFields;
};

export const reconcileAllCustomers = async () => {
  logger.info("Starting background customer financial reconciliation...");
  const customers = await Customer.find({ isDeleted: false }).select("_id name");
  let fixedCount = 0;

  for (const cust of customers) {
    try {
      await recalculateCustomerFinancials(cust._id);
      fixedCount++;
    } catch (err) {
      logger.error(`Error reconciling customer ${cust._id}`, err);
    }
  }

  logger.info(`Reconciliation complete. Processed ${fixedCount} customers.`);
};
