import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Invoice & Payment Integration Tests", () => {
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

  test("Invoice creation calculates UAE VAT and updates Customer cached totals", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        phone: "0566337123",
        address: "Dubai, United Arab Emirates"
      });

    const invRes = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        lineItems: [
          { description: "Annual Pest Control Treatment", quantity: 1, rate: 1000, discount: 0 }
        ]
      });

    assert.equal(invRes.status, 201);
    assert.equal(invRes.body.subtotal, 1000.0);
    assert.equal(invRes.body.vatAmount, 50.0);
    assert.equal(invRes.body.totalAmount, 1050.0);
    assert.equal(invRes.body.balanceAmount, 1050.0);
    assert.equal(invRes.body.status, "UNPAID");

    const customerRes = await request(app)
      .get(`/api/customers/${custRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(customerRes.body.customer.totalRevenue, 1050.0);
    assert.equal(customerRes.body.customer.outstandingBalance, 1050.0);
    assert.equal(customerRes.body.customer.paidTotal, 0);
  });

  test("POST /api/payments records payment, updates invoice status to PAID, and updates customer balance", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Fatima Al Mansoori",
        phone: "+971 55 987 6543",
        address: "Dubai Marina"
      });

    const invRes = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        lineItems: [{ description: "Villa Pest Control", quantity: 1, rate: 500, discount: 0 }]
      });

    const invoiceId = invRes.body.id;
    const totalAmount = invRes.body.totalAmount; // 525.0

    const payRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Idempotency-Key", "test-uuid-key-001")
      .send({
        invoiceId,
        amount: totalAmount,
        paymentMethod: "Bank Transfer",
        referenceNumber: "TXN-998877"
      });

    assert.equal(payRes.status, 201);
    assert.equal(payRes.body.amount, 525.0);

    // Verify invoice status is now PAID
    const updatedInvRes = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(updatedInvRes.body.invoice.paidAmount, 525.0);
    assert.equal(updatedInvRes.body.invoice.balanceAmount, 0.0);
    assert.equal(updatedInvRes.body.invoice.status, "PAID");

    // Verify customer outstanding balance is 0
    const updatedCustRes = await request(app)
      .get(`/api/customers/${custRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(updatedCustRes.body.customer.outstandingBalance, 0);
    assert.equal(updatedCustRes.body.customer.paidTotal, 525.0);
  });

  test("POST /api/payments rejects overpayment with 409 Conflict", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Tariq Mahmood",
        phone: "+971 52 444 5566",
        address: "Karama, Dubai"
      });

    const invRes = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        lineItems: [{ description: "Restaurant Control", quantity: 1, rate: 300, discount: 0 }]
      });

    const invoiceId = invRes.body.id; // Total 315.0

    const payRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        invoiceId,
        amount: 500 // Overpayment
      });

    assert.equal(payRes.status, 409);
    assert.match(payRes.body.message, /exceeds remaining invoice balance/i);
  });
});
