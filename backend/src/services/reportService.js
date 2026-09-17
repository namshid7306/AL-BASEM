import { Invoice } from "../models/Invoice.js";
import { Expense } from "../models/Expense.js";
import { Service } from "../models/Service.js";
import { roundHalfUp } from "../utils/money.js";

export const reportService = {
  getReports: async (query = {}) => {
    const { startDate, endDate } = query;
    const invoiceFilter = { isDeleted: false, status: { $ne: "CANCELLED" } };
    const expenseFilter = { isDeleted: false };
    const serviceFilter = { isDeleted: false };

    if (startDate || endDate) {
      invoiceFilter.invoiceDate = {};
      expenseFilter.date = {};
      serviceFilter.scheduledDate = {};
      if (startDate) {
        invoiceFilter.invoiceDate.$gte = new Date(startDate);
        expenseFilter.date.$gte = new Date(startDate);
        serviceFilter.scheduledDate.$gte = new Date(startDate);
      }
      if (endDate) {
        invoiceFilter.invoiceDate.$lte = new Date(endDate);
        expenseFilter.date.$lte = new Date(endDate);
        serviceFilter.scheduledDate.$lte = new Date(endDate);
      }
    }

    // 1. Sales & Output VAT from Invoices
    const invoiceAgg = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$subtotal" },
          vatCollected: { $sum: "$vatAmount" }
        }
      }
    ]);

    const totalSales = roundHalfUp(invoiceAgg[0]?.totalSales || 0);
    const vatCollected = roundHalfUp(invoiceAgg[0]?.vatCollected || 0);
    const totalRevenueWithVat = roundHalfUp(totalSales + vatCollected);

    // 2. Expenses & Input VAT (strictly recoverable only)
    const expenseAgg = await Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          inputVatRecoverable: {
            $sum: {
              $cond: [{ $eq: ["$isVatRecoverable", true] }, "$vatAmount", 0]
            }
          }
        }
      }
    ]);

    const totalExpenses = roundHalfUp(expenseAgg[0]?.totalExpenses || 0);
    const inputVatRecoverable = roundHalfUp(expenseAgg[0]?.inputVatRecoverable || 0);
    const netVatPayable = Math.max(0, roundHalfUp(vatCollected - inputVatRecoverable));
    const netProfit = roundHalfUp(totalSales - totalExpenses);

    // 3. Service Type Breakdown
    const serviceAgg = await Service.aggregate([
      { $match: serviceFilter },
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const serviceTypeBreakdown = serviceAgg.map((s) => ({
      name: s._id || "Other Treatment",
      count: s.count,
      total: roundHalfUp(s.total)
    }));

    return {
      financials: {
        totalSales,
        vatCollected,
        totalRevenueWithVat,
        totalExpenses,
        inputVatRecoverable,
        netVatPayable,
        netProfit
      },
      serviceTypeBreakdown
    };
  }
};
