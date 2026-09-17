import mongoose from "mongoose";
import { Payment } from "../models/Payment.js";
import { Invoice } from "../models/Invoice.js";
import { Service } from "../models/Service.js";
import { Customer } from "../models/Customer.js";
import { Notification } from "../models/Notification.js";
import { runWithTransaction } from "../utils/transaction.js";;
import { generatePaymentNumber } from "../utils/sequence.js";
import { determineInvoiceStatus, roundHalfUp, toDecimal } from "../utils/money.js";
import { recalculateCustomerFinancials } from "../utils/reconciliation.js";
import { AppError } from "../middleware/errorHandler.js";

export const paymentService = {
  getPayments: async (query = {}) => {
    const { search, status, paymentMethod, date, startDate, endDate } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { paymentNumber: searchRegex },
        { invoiceNumber: searchRegex },
        { customerName: searchRegex },
        { referenceNumber: searchRegex }
      ];
    }

    if (status && status !== "all") {
      filterConditions.status = status.toUpperCase();
    }

    if (paymentMethod && paymentMethod !== "all") {
      filterConditions.paymentMethod = new RegExp(`^${paymentMethod.trim()}$`, "i");
    }

    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;

    if (date && date !== "all") {
      const now = new Date();
      if (date === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (date === "this_week") {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (date === "this_month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    }

    if (start || end) {
      filterConditions.paymentDate = {};
      if (start) filterConditions.paymentDate.$gte = start;
      if (end) filterConditions.paymentDate.$lte = end;
    }

    const payments = await Payment.find(filterConditions).sort({ paymentDate: -1 });
    return { payments, total: payments.length };
  },

  recordPayment: async (paymentData, idempotencyKey = null) => {
    return runWithTransaction(async (session) => {
      const invoice = await Invoice.findOne({ _id: paymentData.invoiceId, isDeleted: false }).session(session);
      if (!invoice) {
        throw new AppError("Invoice not found", 404);
      }

      const paymentAmount = roundHalfUp(paymentData.amount);
      if (paymentAmount <= 0) {
        throw new AppError("Payment amount must be greater than 0", 422);
      }

      const currentBalance = roundHalfUp(invoice.balanceAmount);
      if (toDecimal(paymentAmount).greaterThan(toDecimal(currentBalance))) {
        throw new AppError(
          `Payment amount (${paymentAmount} AED) exceeds remaining invoice balance (${currentBalance} AED)`,
          409
        );
      }

      const paymentNumber = await generatePaymentNumber(session);
      const referenceNumber = paymentData.referenceNumber || `TXN-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPayment = new Payment({
        paymentNumber,
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: paymentAmount,
        paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
        paymentMethod: paymentData.paymentMethod || "Cash",
        referenceNumber,
        status: "COMPLETED",
        notes: paymentData.notes || "Payment recorded",
        idempotencyKey
      });

      await newPayment.save({ session });

      // Update Invoice totals and status
      const newPaidTotal = roundHalfUp(toDecimal(invoice.paidAmount || 0).plus(paymentAmount));
      const newBalance = Math.max(0, roundHalfUp(toDecimal(invoice.totalAmount).minus(newPaidTotal)));
      const newStatus = determineInvoiceStatus(invoice.totalAmount, newPaidTotal, invoice.dueDate);

      invoice.paidAmount = newPaidTotal;
      invoice.balanceAmount = newBalance;
      invoice.status = newStatus;
      await invoice.save({ session });

      // Update linked service if present
      if (invoice.serviceId) {
        const linkedService = await Service.findById(invoice.serviceId).session(session);
        if (linkedService) {
          linkedService.paidAmount = newPaidTotal;
          linkedService.balanceAmount = newBalance;
          linkedService.paymentStatus = newBalance === 0 ? "PAID" : newPaidTotal > 0 ? "PARTIAL" : "UNPAID";
          await linkedService.save({ session });
        }
      }

      // Synchronize customer financial cache
      await recalculateCustomerFinancials(invoice.customerId, session);

      return newPayment;
    });
  }
};
