import { z } from "zod";

export const settingsUpdateSchema = z.object({
  companyName: z.string().min(2).optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  trn: z.string().optional(),
  logoUrl: z.string().optional(),
  vatRate: z.coerce.number().min(0).max(1).optional(),
  invoicePrefix: z.string().optional(),
  nextInvoiceNum: z.coerce.number().min(1).optional(),
  quotePrefix: z.string().optional(),
  nextQuoteNum: z.coerce.number().min(1).optional(),
  paymentTerms: z.string().optional(),
  defaultNotes: z.string().optional()
});
