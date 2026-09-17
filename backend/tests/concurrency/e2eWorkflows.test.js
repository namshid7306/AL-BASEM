import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Complete End-to-End Business Workflows", () => {
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

  test("Workflow 1: Login -> Customer -> Service -> Invoice -> Payment -> Balance -> Dashboard", async () => {
    // 1. Create Customer
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        phone: "0566337123",
        email: "info@drsafeenas.ae",
        company: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        trn: "104185004900003",
        customerType: "Commercial",
        address: "Dubai, United Arab Emirates"
      });
    assert.equal(custRes.status, 201);
    const customerId = custRes.body.id;

    // 2. Schedule Service with auto-generated tax invoice
    const serviceRes = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId,
        serviceType: "Pest Control Service",
        propertyType: "Commercial",
        rate: 250,
        quantity: 1,
        discount: 0,
        paidAmount: 0,
        generateInvoice: true,
        scheduledDate: new Date().toISOString()
      });
    assert.equal(serviceRes.status, 201);
    assert.equal(serviceRes.body.totalAmount, 262.5);
    const invoiceId = serviceRes.body.invoiceId;
    assert.ok(invoiceId);

    // 3. Record Payment against Invoice
    const payRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Idempotency-Key", "e2e-pay-workflow-1")
      .send({
        invoiceId,
        amount: 262.5,
        paymentMethod: "Bank Transfer",
        referenceNumber: "TXN-998877"
      });
    assert.equal(payRes.status, 201);

    // 4. Verify Customer Balance is 0
    const custDetail = await request(app)
      .get(`/api/customers/${customerId}`)
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(custDetail.body.customer.totalRevenue, 262.5);
    assert.equal(custDetail.body.customer.paidTotal, 262.5);
    assert.equal(custDetail.body.customer.outstandingBalance, 0);

    // 5. Verify Dashboard Reflects Financial Overview
    const dashRes = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.financials.todayRevenue, 262.5);
    assert.equal(dashRes.body.financials.pendingPayments, 0);
  });

  test("Workflow 2: Customer -> Contract -> Visits -> Calendar -> Renewal", async () => {
    // 1. Create Customer
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Commercial Tower Management",
        phone: "+971 4 555 6677",
        address: "Business Bay, Dubai"
      });
    const customerId = custRes.body.id;

    // 2. Create Annual Contract (monthly frequency = 12 visits)
    const contractRes = await request(app)
      .post("/api/contracts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId,
        planName: "Annual Commercial Tower Care",
        serviceType: "General Pest Control",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T23:59:59.000Z",
        serviceFrequency: "monthly",
        totalVisits: 12,
        totalAmount: 4800
      });
    assert.equal(contractRes.status, 201);
    const contractId = contractRes.body.id;

    // 3. Verify 12 Scheduled Service Visits generated
    const contractDetail = await request(app)
      .get(`/api/contracts/${contractId}`)
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(contractDetail.body.services.length, 12);

    // 4. Calendar Query by Date Range
    const calRes = await request(app)
      .get("/api/services?startDate=2026-01-01T00:00:00.000Z&endDate=2026-03-31T23:59:59.000Z")
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(calRes.status, 200);
    assert.equal(calRes.body.services.length, 3); // Jan, Feb, Mar

    // 5. Renew Contract
    const renewRes = await request(app)
      .post(`/api/contracts/${contractId}/renew`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ totalAmount: 5200 });
    assert.equal(renewRes.status, 201);
    assert.equal(renewRes.body.historicalVersion, 2);
  });

  test("Workflow 3: Customer -> Quotation -> Conversion -> Invoice -> Payment", async () => {
    // 1. Create Customer
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Al Mansoori Villa",
        phone: "+971 50 222 3344",
        address: "Jumeirah 1, Dubai"
      });
    const customerId = custRes.body.id;

    // 2. Create Quotation
    const quoteRes = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId,
        subject: "Villa Termite Pre-treatment",
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [{ description: "Termite Soil Treatment", quantity: 1, rate: 1200, discount: 0 }]
      });
    assert.equal(quoteRes.status, 201);
    assert.equal(quoteRes.body.grandTotal, 1260.0); // 1200 + 5% VAT (60)
    const quoteId = quoteRes.body.id;

    // 3. Convert to Invoice
    const convRes = await request(app)
      .post(`/api/quotations/${quoteId}/convert-to-invoice`)
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(convRes.status, 200);
    const invoiceId = convRes.body.invoice.id;

    // 4. Pay in 2 partial installments
    const pay1 = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ invoiceId, amount: 600, paymentMethod: "Card" });
    assert.equal(pay1.status, 201);

    const invAfterPay1 = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(invAfterPay1.body.invoice.status, "PARTIAL");
    assert.equal(invAfterPay1.body.invoice.balanceAmount, 660.0);

    const pay2 = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ invoiceId, amount: 660, paymentMethod: "Cash" });
    assert.equal(pay2.status, 201);

    const invAfterPay2 = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(invAfterPay2.body.invoice.status, "PAID");
    assert.equal(invAfterPay2.body.invoice.balanceAmount, 0.0);
  });

  test("Workflow 4: Expense -> Reports -> VAT", async () => {
    // 1. Log Unregistered Expense
    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        category: "parking",
        description: "RTA Parking Ticket",
        amount: 50,
        date: new Date().toISOString()
      });

    // 2. Log Registered Expense with Tax Invoice
    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        category: "medicine",
        description: "Insecticide Concentrate",
        amount: 210,
        date: new Date().toISOString(),
        isVatApplicable: true,
        vatRate: 0.05,
        vatAmount: 10.0,
        isVatRecoverable: true,
        supplierName: "National Pest Supplies LLC",
        supplierTrn: "100111222333003",
        taxInvoiceRef: "NPS-INV-4455"
      });

    // 3. Check Reports
    const repRes = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${authToken}`);
    assert.equal(repRes.status, 200);
    assert.equal(repRes.body.financials.totalExpenses, 260.0); // 50 + 210
    assert.equal(repRes.body.financials.inputVatRecoverable, 10.0);
  });
});
