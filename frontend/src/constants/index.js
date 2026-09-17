export const COMPANY_INFO = {
  name: "AL BASEM PUBLIC HEALTH PESTS CONTROL SERVICES L.L.C",
  shortName: "AL BASEM PEST CONTROL",
  location: "Dubai, United Arab Emirates",
  currency: "AED",
  defaultVatRate: 0.05, // 5% UAE VAT
  defaultCountry: "United Arab Emirates",
  defaultCity: "Dubai",
  phone: "+971 4 123 4567",
  email: "info@albasem.ae",
  website: "www.albasem.ae",
  trn: "100987654300003"
};

export const SERVICE_TYPES = [
  { id: "general_pest", name: "General Pest Control", defaultRate: 250 },
  { id: "termite", name: "Termite Control & Soil Treatment", defaultRate: 1200 },
  { id: "bedbugs", name: "Bed Bugs Treatment", defaultRate: 450 },
  { id: "rodents", name: "Rodent & Mouse Control", defaultRate: 300 },
  { id: "cockroaches", name: "Cockroach Control", defaultRate: 200 },
  { id: "fumigation", name: "Fumigation Service", defaultRate: 800 },
  { id: "sanitization", name: "Disinfection & Sanitization", defaultRate: 350 },
  { id: "birds", name: "Bird Control & Netting", defaultRate: 950 }
];

export const PROPERTY_TYPES = [
  { id: "villa", name: "Villa" },
  { id: "apartment", name: "Apartment" },
  { id: "commercial", name: "Commercial Office" },
  { id: "restaurant", name: "Restaurant / Cafe" },
  { id: "warehouse", name: "Warehouse / Industrial" },
  { id: "building", name: "Entire Building" },
  { id: "hotel", name: "Hotel / Hospitality" }
];

export const BUILTIN_PROPERTY_TYPES = [
  "Villa",
  "Apartment",
  "Commercial Office",
  "Restaurant / Cafe",
  "Warehouse / Industrial",
  "Entire Building",
  "Hotel / Hospitality"
];

export const DEFAULT_PROPERTY_SIZES = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "5 BHK"
];

export const SERVICE_FREQUENCIES = [
  { id: "one_time", name: "One-Time Service" },
  { id: "weekly", name: "Weekly" },
  { id: "bi_weekly", name: "Bi-Weekly (Every 2 Weeks)" },
  { id: "monthly", name: "Monthly" },
  { id: "every_2_months", name: "Every 2 Months" },
  { id: "quarterly", name: "Quarterly (Every 3 Months)" },
  { id: "half_yearly", name: "Half-Yearly (Every 6 Months)" },
  { id: "yearly", name: "Yearly" },
  { id: "custom", name: "Custom Schedule" }
];

export const PAYMENT_FREQUENCIES = [
  { id: "one_time", name: "Pay Upfront (Full)" },
  { id: "per_service", name: "Pay Per Visit" },
  { id: "monthly", name: "Monthly Payments" },
  { id: "quarterly", name: "Quarterly Installments" },
  { id: "half_yearly", name: "Bi-Annual Installments" },
  { id: "yearly", name: "Annual Installment" }
];

export const EXPENSE_CATEGORIES = [
  { id: "petrol", name: "Petrol / Fuel" },
  { id: "parking", name: "Parking Fees" },
  { id: "maintenance", name: "Vehicle Maintenance" },
  { id: "recharge", name: "Mobile / Salik Recharge" },
  { id: "medicine", name: "Chemicals & Medicines" },
  { id: "salary", name: "Technician Salary & Allowance" },
  { id: "office", name: "Office Supplies & Rent" },
  { id: "vehicle", name: "Vehicle Lease & RTA" },
  { id: "purchase", name: "Equipment Purchase" },
  { id: "marketing", name: "Marketing & Ads" },
  { id: "other", name: "Other Expenses" }
];

export const PAYMENT_METHODS = [
  { id: "cash", name: "Cash" },
  { id: "card", name: "Credit / Debit Card" },
  { id: "bank_transfer", name: "Bank Transfer" },
  { id: "cheque", name: "Cheque" },
  { id: "online", name: "Online Payment Gateway" }
];

export const SERVICE_STATUSES = {
  UPCOMING: { label: "Upcoming", color: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RESCHEDULED: { label: "Rescheduled", color: "bg-amber-50 text-amber-700 border-amber-200" },
  CANCELLED: { label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200" }
};

export const INVOICE_STATUSES = {
  PAID: { label: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PARTIAL: { label: "Partial", color: "bg-blue-50 text-blue-700 border-blue-200" },
  UNPAID: { label: "Unpaid", color: "bg-amber-50 text-amber-700 border-amber-200" },
  OVERDUE: { label: "Overdue", color: "bg-rose-50 text-rose-700 border-rose-200" }
};

export const QUOTATION_STATUSES = {
  DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  SENT: { label: "Sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
  ACCEPTED: { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" },
  EXPIRED: { label: "Expired", color: "bg-amber-50 text-amber-700 border-amber-200" }
};
