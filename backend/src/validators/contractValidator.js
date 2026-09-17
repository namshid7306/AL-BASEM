import { z } from "zod";
import { SERVICE_FREQUENCIES, PAYMENT_FREQUENCIES, CONTRACT_STATUSES } from "../config/constants.js";

export const contractCreateSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  planName: z.string().min(2, "Plan name is required"),
  serviceType: z.string().min(1, "Service type is required"),
  propertyType: z.string().default("Villa"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  serviceFrequency: z.enum(SERVICE_FREQUENCIES).default("monthly"),
  paymentFrequency: z.enum(PAYMENT_FREQUENCIES).default("quarterly"),
  totalVisits: z.coerce.number().min(1).max(52).default(12),
  totalAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().default("")
});

export const contractRenewSchema = z.object({
  planName: z.string().optional(),
  serviceType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  serviceFrequency: z.enum(SERVICE_FREQUENCIES).optional(),
  paymentFrequency: z.enum(PAYMENT_FREQUENCIES).optional(),
  totalVisits: z.coerce.number().min(1).max(52).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional()
});

export const contractStatusSchema = z.object({
  status: z.enum(CONTRACT_STATUSES)
});
