import { Expense } from "../models/Expense.js";
import { EXPENSE_CATEGORIES } from "../config/constants.js";
import { roundHalfUp } from "../utils/money.js";
import { AppError } from "../middleware/errorHandler.js";

const CATEGORY_NAMES = {
  petrol: "Petrol / Fuel",
  parking: "Parking Fees",
  maintenance: "Vehicle Maintenance",
  recharge: "Mobile / Salik Recharge",
  medicine: "Chemicals & Medicines",
  salary: "Technician Salary & Allowance",
  office: "Office Supplies & Rent",
  vehicle: "Vehicle Lease & RTA",
  purchase: "Equipment Purchase",
  marketing: "Marketing & Ads",
  other: "Other Expenses"
};

export const expenseService = {
  getExpenses: async (query = {}) => {
    const { search, category, paymentMethod, date, startDate, endDate } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { description: searchRegex },
        { categoryName: searchRegex },
        { notes: searchRegex }
      ];
    }

    if (category && category !== "all") {
      filterConditions.category = category.toLowerCase();
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
      filterConditions.date = {};
      if (start) filterConditions.date.$gte = start;
      if (end) filterConditions.date.$lte = end;
    }

    const expenses = await Expense.find(filterConditions).sort({ date: -1 });
    const totalExpenses = roundHalfUp(expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0));

    return { expenses, totalExpenses };
  },

  createExpense: async (expenseData) => {
    const amount = roundHalfUp(expenseData.amount);
    const categoryName = CATEGORY_NAMES[expenseData.category] || "Other Expenses";

    // Strict UAE FTA rule: default to non-recoverable 0% unless explicitly verified
    const isVatApplicable = Boolean(expenseData.isVatApplicable);
    const isVatRecoverable = isVatApplicable && Boolean(expenseData.isVatRecoverable);
    const vatRate = isVatApplicable ? Number(expenseData.vatRate || 0.05) : 0;
    const vatAmount = isVatApplicable ? roundHalfUp(expenseData.vatAmount || 0) : 0;

    const newExpense = new Expense({
      category: expenseData.category,
      categoryName,
      description: expenseData.description,
      amount,
      date: expenseData.date ? new Date(expenseData.date) : new Date(),
      paymentMethod: expenseData.paymentMethod || "Cash",
      receiptUrl: expenseData.receiptUrl || "",
      notes: expenseData.notes || "",
      isVatApplicable,
      vatRate,
      vatAmount,
      isVatRecoverable,
      supplierName: expenseData.supplierName || "",
      supplierTrn: expenseData.supplierTrn || "",
      taxInvoiceRef: expenseData.taxInvoiceRef || ""
    });

    await newExpense.save();
    return newExpense;
  },

  deleteExpense: async (id) => {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!expense) {
      throw new AppError("Expense not found", 404);
    }
    return { success: true };
  }
};
