import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";

describe("Customer Management Integration Tests", () => {
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

  test("POST /api/customers creates a new customer", async () => {
    const res = await request(app)
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

    assert.equal(res.status, 201);
    assert.equal(res.body.name, "DR SAFEENAS WELLNSS CLINLIC L.L.C");
    assert.equal(res.body.totalRevenue, 0);
    assert.equal(res.body.outstandingBalance, 0);
  });

  test("GET /api/customers returns customer list and total", async () => {
    await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Fatima Al Mansoori",
        phone: "+971 55 987 6543",
        address: "Apartment 1204, Marina Crown, Dubai Marina"
      });

    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.customers));
    assert.equal(res.body.total, 1);
  });
});
