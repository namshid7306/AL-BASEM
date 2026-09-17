import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Reports & VAT Integration Tests", () => {
  let authToken;

  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });
    authToken = loginRes.body.token;
  });

  test("GET /api/reports calculates authoritative P&L and UAE VAT returns", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        phone: "0566337123",
        address: "Dubai, UAE"
      });

    // 1. Create Invoice: subtotal 1000, VAT 50, Total 1050
    await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        lineItems: [{ description: "Treatment", quantity: 1, rate: 1000, discount: 0 }]
      });

    // 2. Create Unregistered Expense: 200 AED, 0% VAT
    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        category: "petrol",
        description: "Fuel",
        amount: 200,
        date: new Date().toISOString()
      });

    // 3. Create Registered Expense with valid Tax Invoice: 100 AED + 5 AED recoverable VAT
    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        category: "medicine",
        description: "Bayer Maxforce Gel",
        amount: 105,
        date: new Date().toISOString(),
        isVatApplicable: true,
        vatRate: 0.05,
        vatAmount: 5.0,
        isVatRecoverable: true,
        supplierName: "Bayer Middle East FZE",
        supplierTrn: "100999888700003",
        taxInvoiceRef: "TAX-INV-888"
      });

    const reportRes = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(reportRes.status, 200);
    const { financials } = reportRes.body;

    assert.equal(financials.totalSales, 1000.0);
    assert.equal(financials.vatCollected, 50.0);
    assert.equal(financials.totalExpenses, 305.0); // 200 + 105
    assert.equal(financials.inputVatRecoverable, 5.0); // ONLY the verified 5.0 AED
    assert.equal(financials.netVatPayable, 45.0); // 50.0 - 5.0
    assert.equal(financials.netProfit, 695.0); // 1000 - 305
  });
});
