import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Global Search Integration Tests", () => {
  let authToken;

  before(async () => {
    await setupTestDB();
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });
    authToken = loginRes.body.token;
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

  test("GET /api/search returns grouped results across customers, services, invoices, quotations, expenses", async () => {
    // 1. Create a customer
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS CLINIC",
        phone: "0566337123",
        company: "DR SAFEENAS L.L.C",
        address: "Dubai, UAE"
      });

    const customerId = custRes.body._id || custRes.body.id;

    // 2. Create a service
    await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId,
        serviceType: "General Pest Control",
        propertyAddress: "Dubai, UAE",
        rate: 250,
        quantity: 1,
        scheduledDate: new Date().toISOString(),
        generateInvoice: true,
        paidAmount: 0
      });

    // 3. Search for "SAFEENAS"
    const searchRes = await request(app)
      .get("/api/search?q=SAFEENAS")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(searchRes.status, 200);
    assert.ok(Array.isArray(searchRes.body.customers));
    assert.ok(Array.isArray(searchRes.body.services));
    assert.ok(Array.isArray(searchRes.body.invoices));
    assert.ok(Array.isArray(searchRes.body.quotations));
    assert.ok(Array.isArray(searchRes.body.expenses));

    assert.equal(searchRes.body.customers.length, 1);
    assert.equal(searchRes.body.customers[0].name, "DR SAFEENAS CLINIC");
    assert.equal(searchRes.body.services.length, 1);
    assert.equal(searchRes.body.invoices.length, 1);
  });

  test("GET /api/search with empty query returns empty arrays", async () => {
    const searchRes = await request(app)
      .get("/api/search?q=")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(searchRes.status, 200);
    assert.deepEqual(searchRes.body, {
      customers: [],
      services: [],
      invoices: [],
      quotations: [],
      expenses: []
    });
  });
});
