import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Concurrency & Idempotency Tests", () => {
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

  test("Idempotency key prevents double payments on duplicate client submission", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Double Submit Test",
        phone: "+971 50 999 8888",
        address: "Dubai"
      });

    const invRes = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        lineItems: [{ description: "Treatment", quantity: 1, rate: 200, discount: 0 }]
      });

    const invoiceId = invRes.body.id;
    const idempotencyKey = "unique-key-xyz-777";

    // First submission
    const res1 = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({
        invoiceId,
        amount: 210.0,
        paymentMethod: "Cash"
      });

    assert.equal(res1.status, 201);
    const paymentId = res1.body.id;

    // Second submission with same idempotency key (simulating double click or network retry)
    const res2 = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({
        invoiceId,
        amount: 210.0,
        paymentMethod: "Cash"
      });

    assert.equal(res2.status, 201);
    assert.equal(res2.body.id, paymentId); // Returns identical cached payment

    // Verify invoice was only paid ONCE
    const checkInv = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(checkInv.body.invoice.paidAmount, 210.0);
    assert.equal(checkInv.body.invoice.balanceAmount, 0.0);
  });
});
