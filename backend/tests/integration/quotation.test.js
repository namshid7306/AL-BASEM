import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Quotation Integration Tests", () => {
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

  test("Create Quotation and Convert to Tax Invoice atomically", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        phone: "0566337123",
        address: "Dubai, United Arab Emirates"
      });

    const quoteRes = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        subject: "Annual Pest Control Quotation",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          { description: "General Pest Control Treatment", quantity: 1, rate: 250, discount: 0 }
        ]
      });

    assert.equal(quoteRes.status, 201);
    assert.equal(quoteRes.body.grandTotal, 262.5);
    assert.equal(quoteRes.body.status, "SENT");

    const quoteId = quoteRes.body.id;

    // Convert quotation to invoice
    const convRes = await request(app)
      .post(`/api/quotations/${quoteId}/convert-to-invoice`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(convRes.status, 200);
    assert.equal(convRes.body.quotation.status, "ACCEPTED");
    assert.ok(convRes.body.invoice.invoiceNumber);
    assert.equal(convRes.body.invoice.totalAmount, 262.5);

    // Attempting to convert a second time must fail with 409 Conflict
    const doubleConvRes = await request(app)
      .post(`/api/quotations/${quoteId}/convert-to-invoice`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(doubleConvRes.status, 409);
  });
});
