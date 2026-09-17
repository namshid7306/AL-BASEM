import { z } from "zod";
import { QUOTATION_STATUSES } from "../config/constants.js";

const quoteLineItemInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1).default(1),
  rate: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0)
});

export const quotationCreateSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  address: z.string().optional(),
  subject: z.string().default("Pest Control Services Quotation"),
  date: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(QUOTATION_STATUSES).default("SENT"),
  lineItems: z.array(quoteLineItemInputSchema).min(1, "At least one line item is required"),
  notes: z.string().optional()
});
