import { format, parseISO, isValid } from "date-fns";

export const formatCurrency = (amount, currency = "AED") => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount).replace("AED", "").trim() + ` ${currency}`;
};

export const formatAmountOnly = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
};

export const formatDate = (dateInput, formatStr = "dd MMM yyyy") => {
  if (!dateInput) return "N/A";
  let dateObj = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if (!isValid(dateObj)) {
    dateObj = new Date(dateInput);
  }
  return isValid(dateObj) ? format(dateObj, formatStr) : "N/A";
};

export const formatDateTime = (dateInput) => {
  return formatDate(dateInput, "dd MMM yyyy, hh:mm a");
};

export const calculateVatDetails = (amount = 0, vatRate = 0.05, isTaxInclusive = false) => {
  const numericAmount = Number(amount) || 0;
  let subtotal = 0;
  let vatAmount = 0;
  let total = 0;

  if (isTaxInclusive) {
    total = numericAmount;
    subtotal = numericAmount / (1 + vatRate);
    vatAmount = total - subtotal;
  } else {
    subtotal = numericAmount;
    vatAmount = subtotal * vatRate;
    total = subtotal + vatAmount;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    vatRatePercent: vatRate * 100
  };
};

export const calculateLineItemsTotal = (items = [], vatRate = 0.05, isTaxInclusive = false) => {
  let subtotal = 0;
  items.forEach(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount) || 0;
    subtotal += (qty * rate) - discount;
  });

  const vatDetails = calculateVatDetails(subtotal, vatRate, isTaxInclusive);
  return {
    itemsCount: items.length,
    rawSubtotal: subtotal,
    ...vatDetails
  };
};
