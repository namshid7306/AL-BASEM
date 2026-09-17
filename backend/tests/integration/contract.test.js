import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Contract & Expense Integration Tests", () => {
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

  test("Contract creation creates scheduled visits and renewal preserves historical records", async () => {
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "DR SAFEENAS WELLNSS CLINLIC L.L.C",
        phone: "0566337123",
        address: "Dubai, United Arab Emirates"
      });

    const contractRes = await request(app)
      .post("/api/contracts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerId: custRes.body.id,
        planName: "Annual Commercial Clinic Protection",
        serviceType: "Pest Control Service",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T23:59:59.000Z",
        serviceFrequency: "monthly",
        totalVisits: 12,
        totalAmount: 3600
      });

    assert.equal(contractRes.status, 201);
    assert.equal(contractRes.body.totalVisits, 12);
    assert.equal(contractRes.body.status, "ACTIVE");

    // Renew contract
    const renewRes = await request(app)
      .post(`/api/contracts/${contractRes.body.id}/renew`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        totalAmount: 4000
      });

    assert.equal(renewRes.status, 201);
    assert.equal(renewRes.body.historicalVersion, 2);
    assert.match(renewRes.body.contractNumber, /-R2$/);

    // Verify previous contract was marked RENEWED and NOT deleted
    const oldContractRes = await request(app)
      .get(`/api/contracts/${contractRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(oldContractRes.body.contract.status, "RENEWED");
  });

  test("Expense creation defaults unknown VAT to 0% non-recoverable", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        category: "petrol",
        description: "ENOC Station Van Fuel",
        amount: 180,
        date: "2026-07-20T08:30:00.000Z",
        paymentMethod: "Card"
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.amount, 180);
    assert.equal(res.body.vatAmount, 0);
    assert.equal(res.body.isVatRecoverable, false);
  });
});
