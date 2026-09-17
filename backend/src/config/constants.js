export const ROLES = {
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
  ACCOUNTANT: "ACCOUNTANT",
  MANAGER: "MANAGER"
};

export const USER_ROLES_ARRAY = Object.values(ROLES);

export const DEFAULT_VAT_RATE = 0.05; // 5% UAE VAT

export const SERVICE_FREQUENCIES = [
  "one_time",
  "weekly",
  "bi_weekly",
  "monthly",
  "every_2_months",
  "quarterly",
  "half_yearly",
  "yearly",
  "custom"
];

export const PAYMENT_FREQUENCIES = [
  "one_time",
  "per_service",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly"
];

export const SERVICE_STATUSES = ["UPCOMING", "COMPLETED", "RESCHEDULED", "CANCELLED"];

export const INVOICE_STATUSES = ["UNPAID", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"];

export const QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

export const CONTRACT_STATUSES = ["ACTIVE", "EXPIRED", "RENEWED", "TERMINATED"];

export const EXPENSE_CATEGORIES = [
  "petrol",
  "parking",
  "maintenance",
  "recharge",
  "medicine",
  "salary",
  "office",
  "vehicle",
  "purchase",
  "marketing",
  "other"
];

export const PAYMENT_METHODS = [
  "Cash",
  "Credit / Debit Card",
  "Card",
  "Bank Transfer",
  "Cheque",
  "Online Payment Gateway"
];

export const NOTIFICATION_TYPES = ["service", "payment", "contract", "invoice", "system"];
