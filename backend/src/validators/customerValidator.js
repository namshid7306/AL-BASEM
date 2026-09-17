import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(5, "Phone number is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  company: z.string().trim().optional().or(z.literal("")),
  trn: z.string().trim().optional().or(z.literal("")),
  customerType: z.string().trim().default("Villa"),
  address: z.string().trim().min(3, "Address is required")
});

export const customerUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().trim().min(5, "Phone number is required").optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  company: z.string().trim().optional().or(z.literal("")),
  trn: z.string().trim().optional().or(z.literal("")),
  customerType: z.string().trim().min(1, "Customer type is required").optional(),
  address: z.string().trim().min(3, "Address is required").optional()
});
