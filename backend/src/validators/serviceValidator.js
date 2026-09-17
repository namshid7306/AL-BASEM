import { z } from "zod";
import { SERVICE_STATUSES } from "../config/constants.js";

export const serviceCreateSchema = z
  .object({
    customerId: z.string().min(1, "Please select an existing customer"),
    serviceType: z.string().min(1, "Service type is required"),
    propertyType: z.string().default("1 BHK"),
    propertyAddress: z.string().optional(),
    quantity: z.coerce.number().min(1).optional().default(1),
    rate: z.coerce.number().min(0).default(0),
    discount: z.coerce.number().min(0).default(0),
    scheduledDate: z.string().min(1, "Scheduled date is required"),
    paidAmount: z.coerce.number().min(0).default(0),
    paymentMethod: z.string().default("Cash"),
    generateInvoice: z.boolean().default(true),
    technicianNotes: z.string().optional().default(""),
    status: z.enum(SERVICE_STATUSES).default("UPCOMING")
  })
  .superRefine((data, ctx) => {
    // If paidAmount > 0, generateInvoice MUST be true
    if (data.paidAmount > 0 && !data.generateInvoice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot collect payment without generating a tax invoice. Please enable 'Auto-generate Tax Invoice' or set Paid Amount to 0.",
        path: ["generateInvoice"]
      });
    }
  });

export const serviceUpdateSchema = z.object({
  serviceType: z.string().optional(),
  propertyType: z.string().optional(),
  propertyAddress: z.string().optional(),
  scheduledDate: z.string().optional(),
  status: z.enum(SERVICE_STATUSES).optional(),
  technicianNotes: z.string().optional(),
  rate: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().min(1).optional(),
  discount: z.coerce.number().min(0).optional()
});
