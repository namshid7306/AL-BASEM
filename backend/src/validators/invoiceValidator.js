import { z } from "zod";

const lineItemInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1).default(1),
  rate: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0)
});

export const invoiceCreateSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerTrn: z.string().optional(),
  customerAddress: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  lineItems: z.array(lineItemInputSchema).min(1, "At least one line item is required"),
  notes: z.string().optional(),
  serviceId: z.string().optional(),
  quotationId: z.string().optional()
});
