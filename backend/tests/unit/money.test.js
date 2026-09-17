import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  roundHalfUp,
  calculateLineItem,
  calculateDocumentTotals,
  calculateVatDetails,
  determineInvoiceStatus
} from "../../src/utils/money.js";

describe("Money & VAT Calculation Engine", () => {
  test("roundHalfUp rounds to 2 decimal places using half-up rule", () => {
    assert.equal(roundHalfUp(12.555), 12.56);
    assert.equal(roundHalfUp(12.554), 12.55);
    assert.equal(roundHalfUp(0.005), 0.01);
    assert.equal(roundHalfUp(0.004), 0.0);
    assert.equal(roundHalfUp(250.0), 250.0);
  });

  test("calculateVatDetails - Tax Exclusive Mode (5% UAE VAT)", () => {
    const result = calculateVatDetails(250, 0.05, false);
    assert.equal(result.subtotal, 250.0);
    assert.equal(result.vatAmount, 12.5);
    assert.equal(result.total, 262.5);
    assert.equal(result.vatRatePercent, 5);
  });

  test("calculateVatDetails - Tax Inclusive Mode", () => {
    const result = calculateVatDetails(262.5, 0.05, true);
    assert.equal(result.total, 262.5);
    assert.equal(result.subtotal, 250.0);
    assert.equal(result.vatAmount, 12.5);
  });

  test("calculateLineItem calculates correct rate, discount, subtotal, and VAT", () => {
    const item = { description: "General Pest Control", quantity: 2, rate: 200, discount: 50 };
    const line = calculateLineItem(item, 0.05, false);
    // (2 * 200) - 50 = 350 subtotal
    // 350 * 0.05 = 17.5 VAT
    // Total = 367.5
    assert.equal(line.subtotal, 350.0);
    assert.equal(line.vatAmount, 17.5);
    assert.equal(line.totalAmount, 367.5);
  });

  test("calculateDocumentTotals sums multiple line items without binary float drift", () => {
    const items = [
      { description: "General Pest Control", quantity: 1, rate: 250, discount: 0 },
      { description: "Gel Treatment", quantity: 3, rate: 45.33, discount: 10 }
    ];
    // Item 1: 250, VAT = 12.5, Total = 262.5
    // Item 2: (3 * 45.33) - 10 = 135.99 - 10 = 125.99, VAT = 125.99 * 0.05 = 6.30, Total = 132.29
    const doc = calculateDocumentTotals(items, 0.05, false);
    assert.equal(doc.subtotal, 375.99);
    assert.equal(doc.vatAmount, 18.8);
    assert.equal(doc.totalAmount, 394.79);
  });

  test("determineInvoiceStatus evaluates deterministic state transitions", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fully Paid -> PAID
    assert.equal(determineInvoiceStatus(262.5, 262.5, futureDate), "PAID");
    assert.equal(determineInvoiceStatus(262.5, 262.5, pastDate), "PAID"); // Paid overrides overdue

    // 2. Unpaid before due date -> UNPAID
    assert.equal(determineInvoiceStatus(262.5, 0, futureDate), "UNPAID");

    // 3. Partially paid before due date -> PARTIAL
    assert.equal(determineInvoiceStatus(262.5, 100, futureDate), "PARTIAL");

    // 4. Past due with balance -> OVERDUE
    assert.equal(determineInvoiceStatus(262.5, 0, pastDate), "OVERDUE");
    assert.equal(determineInvoiceStatus(262.5, 100, pastDate), "OVERDUE");
  });
});
