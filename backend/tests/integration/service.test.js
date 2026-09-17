import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Service Management Integration Tests", () => {
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

  test("POST /api/services rejects paidAmount > 0 when generateInvoice is false", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Customer",
        phone: "+971 50 111 2222",
        address: "Deira, Dubai"
      });

    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        serviceType: "General Pest Control",
        rate: 250,
        paidAmount: 262.5,
        generateInvoice: false, // Invalid combination!
        scheduledDate: new Date().toISOString()
      });

    assert.equal(res.status, 422);
    assert.match(res.body.message, /Cannot collect payment without generating a tax invoice/i);
  });

  test("POST /api/services with generateInvoice=true without quantity creates Service, Invoice, and Payment atomically", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        phone: "0566337123",
        customerType: "Commercial Office",
        address: "Dubai, UAE"
      });

    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        serviceType: "Pest Control Service",
        propertyType: "Commercial Office",
        propertyAddress: "Dubai, UAE",
        rate: 250,
        discount: 0,
        paidAmount: 262.5,
        generateInvoice: true,
        scheduledDate: new Date().toISOString()
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.rate, 250);
    assert.equal(res.body.subtotal, 250);
    assert.equal(res.body.totalAmount, 262.5);
    assert.equal(res.body.paidAmount, 262.5);
    assert.equal(res.body.paymentStatus, "PAID");
    assert.ok(res.body.invoiceId);

    // Verify customer derived values updated
    const updatedCustRes = await request(app)
      .get(`/api/customers/${res.body.customerId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(updatedCustRes.body.customer.totalRevenue, 262.5);
    assert.equal(updatedCustRes.body.customer.paidTotal, 262.5);
    assert.equal(updatedCustRes.body.customer.outstandingBalance, 0);
    assert.equal(updatedCustRes.body.customer.servicesCount, 1);
  });

  test("POST /api/services calculates total as (rate - discount) + VAT without requiring quantity", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Al Barsha Villa Owner",
        phone: "0501234567",
        customerType: "Residential Villa",
        address: "Al Barsha, Dubai"
      });

    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        serviceType: "Cockroach Gel & Spray Treatment",
        propertyType: "3 BHK Villa",
        rate: 500,
        discount: 100, // Subtotal should be 400
        paidAmount: 0,
        generateInvoice: true,
        scheduledDate: new Date().toISOString()
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.rate, 500);
    assert.equal(res.body.discount, 100);
    assert.equal(res.body.subtotal, 400); // 500 - 100 = 400
    assert.equal(res.body.vatAmount, 20); // 5% of 400 = 20
    assert.equal(res.body.totalAmount, 420); // 400 + 20 = 420
    assert.equal(res.body.balanceAmount, 420);
    assert.equal(res.body.paymentStatus, "UNPAID");
  });
});
