import { z } from "zod";
import { EXPENSE_CATEGORIES } from "../config/constants.js";

export const expenseCreateSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().min(2, "Description must be at least 2 characters"),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().default("Cash"),
  receiptUrl: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  isVatApplicable: z.boolean().default(false),
  vatRate: z.coerce.number().min(0).max(1).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
  isVatRecoverable: z.boolean().default(false),
  supplierName: z.string().optional().default(""),
  supplierTrn: z.string().optional().default(""),
  taxInvoiceRef: z.string().optional().default("")
});
