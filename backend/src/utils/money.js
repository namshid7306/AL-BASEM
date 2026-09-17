import Decimal from "decimal.js";
import { DEFAULT_VAT_RATE } from "../config/constants.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const toDecimal = (value) => {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(value);
};

export const roundHalfUp = (value, decimals = 2) => {
  return Number(toDecimal(value).toFixed(decimals, Decimal.ROUND_HALF_UP));
};

export const calculateLineItem = (item, vatRate = DEFAULT_VAT_RATE, isTaxInclusive = false) => {
  const qty = toDecimal(item.quantity || 1);
  const rate = toDecimal(item.rate || 0);
  const discount = toDecimal(item.discount || 0);
  const rawSubtotal = Decimal.max(0, qty.times(rate).minus(discount));

  let lineSubtotal;
  let lineVat;
  let lineTotal;

  if (isTaxInclusive) {
    lineTotal = rawSubtotal;
    lineSubtotal = rawSubtotal.dividedBy(toDecimal(1).plus(vatRate));
    lineVat = lineTotal.minus(lineSubtotal);
  } else {
    lineSubtotal = rawSubtotal;
    lineVat = lineSubtotal.times(vatRate);
    lineTotal = lineSubtotal.plus(lineVat);
  }

  const roundedSubtotal = roundHalfUp(lineSubtotal);
  const roundedVat = roundHalfUp(lineVat);
  const roundedTotal = roundHalfUp(lineTotal);

  return {
    description: item.description || "Pest Control Service",
    quantity: Number(qty),
    rate: Number(rate),
    discount: Number(discount),
    subtotal: roundedSubtotal,
    amount: roundedSubtotal, // frontend compatibility
    vatRate: Number(vatRate),
    taxRate: Number(vatRate) * 100,
    vatAmount: roundedVat,
    taxAmount: roundedVat,
    totalAmount: roundedTotal
  };
};

export const calculateDocumentTotals = (items = [], vatRate = DEFAULT_VAT_RATE, isTaxInclusive = false) => {
  const calculatedItems = items.map((item) => calculateLineItem(item, vatRate, isTaxInclusive));

  let subtotal = new Decimal(0);
  let vatAmount = new Decimal(0);

  for (const item of calculatedItems) {
    subtotal = subtotal.plus(item.subtotal);
    vatAmount = vatAmount.plus(item.vatAmount);
  }

  const totalAmount = subtotal.plus(vatAmount);

  return {
    lineItems: calculatedItems,
    subtotal: roundHalfUp(subtotal),
    vatRate: Number(vatRate),
    vatAmount: roundHalfUp(vatAmount),
    totalAmount: roundHalfUp(totalAmount)
  };
};

export const calculateVatDetails = (amount = 0, vatRate = DEFAULT_VAT_RATE, isTaxInclusive = false) => {
  const num = toDecimal(amount);
  let subtotal;
  let vatAmount;
  let total;

  if (isTaxInclusive) {
    total = num;
    subtotal = num.dividedBy(toDecimal(1).plus(vatRate));
    vatAmount = total.minus(subtotal);
  } else {
    subtotal = num;
    vatAmount = subtotal.times(vatRate);
    total = subtotal.plus(vatAmount);
  }

  return {
    subtotal: roundHalfUp(subtotal),
    vatAmount: roundHalfUp(vatAmount),
    total: roundHalfUp(total),
    vatRatePercent: Number(vatRate) * 100
  };
};

export const determineInvoiceStatus = (totalAmount, paidAmount, dueDate) => {
  const total = toDecimal(totalAmount);
  const paid = toDecimal(paidAmount);
  const balance = total.minus(paid);

  if (balance.lessThanOrEqualTo(0) && total.greaterThanOrEqualTo(0)) {
    return "PAID";
  }

  const isOverdue = dueDate && new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

  if (isOverdue) {
    return "OVERDUE";
  }

  if (paid.greaterThan(0)) {
    return "PARTIAL";
  }

  return "UNPAID";
};
