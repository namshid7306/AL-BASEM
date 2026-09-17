import { z } from "zod";

export const paymentRecordSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.coerce.number().gt(0, "Payment amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required").default("Cash"),
  referenceNumber: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  paymentDate: z.string().optional()
});
