import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";
import { RefreshToken } from "../../src/models/RefreshToken.js";
import { User } from "../../src/models/User.js";
import { authService } from "../../src/services/authService.js";

describe("Authentication & Refresh Token Integration Tests", () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test("POST /api/auth/login with valid credentials returns access token, sets HttpOnly refresh cookie, and omits refreshToken/password in JSON", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, "Access token must be returned");
    assert.equal(res.body.user.email, env.ADMIN_EMAIL.toLowerCase());
    assert.equal(res.body.user.role, "ADMIN");
    assert.equal(res.body.refreshToken, undefined, "Raw refresh token must not be in response body");
    assert.equal(res.body.user.passwordHash, undefined, "Password hash must not be in response body");

    // Verify Set-Cookie header
    const cookies = res.headers["set-cookie"];
    assert.ok(cookies, "Set-Cookie header must be present");
    const refreshCookie = cookies.find((c) => c.startsWith("al_basem_refresh_token="));
    assert.ok(refreshCookie, "al_basem_refresh_token cookie must be set");
    assert.ok(refreshCookie.includes("HttpOnly"), "Cookie must be HttpOnly");
    assert.ok(refreshCookie.includes("Path=/api/auth"), "Cookie path must be /api/auth");

    // Verify database stores SHA-256 hash, not raw token
    const tokenCookieValue = refreshCookie.split(";")[0].split("=")[1];
    const decoded = jwt.decode(tokenCookieValue);
    assert.ok(decoded.jti);
    const dbRecord = await RefreshToken.findOne({ tokenId: decoded.jti });
    assert.ok(dbRecord);
    const expectedHash = crypto.createHash("sha256").update(tokenCookieValue).digest("hex");
    assert.equal(dbRecord.tokenHash, expectedHash);
  });

  test("POST /api/auth/login with invalid password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: "WrongPassword123"
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test("POST /api/auth/login with non-existent email returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent-user@example.com",
        password: env.ADMIN_PASSWORD
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test("POST /api/auth/login with missing email or password returns validation error", async () => {
    const resNoEmail = await request(app)
      .post("/api/auth/login")
      .send({ password: env.ADMIN_PASSWORD });
    assert.equal(resNoEmail.status, 422);
    assert.equal(resNoEmail.body.success, false);

    const resNoPass = await request(app)
      .post("/api/auth/login")
      .send({ email: env.ADMIN_EMAIL });
    assert.equal(resNoPass.status, 422);
    assert.equal(resNoPass.body.success, false);
  });

  test("GET /api/auth/me with valid Bearer token returns current user profile", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, env.ADMIN_EMAIL.toLowerCase());
  });

  test("GET /api/auth/me without token or with invalid token returns 401 Unauthorized", async () => {
    const resNoToken = await request(app).get("/api/auth/me");
    assert.equal(resNoToken.status, 401);

    const resInvalidToken = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-tampered-token");
    assert.equal(resInvalidToken.status, 401);
  });

  test("POST /api/auth/refresh rotates refresh token and returns new access token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

    const cookieA = loginRes.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));
    const tokenValA = cookieA.split(";")[0].split("=")[1];
    const decodedA = jwt.decode(tokenValA);

    // Call /api/auth/refresh with Cookie A
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [cookieA]);

    assert.equal(refreshRes.status, 200);
    assert.ok(refreshRes.body.token);

    // Verify new refresh cookie was issued (Cookie B)
    const cookieB = refreshRes.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));
    assert.ok(cookieB);
    const tokenValB = cookieB.split(";")[0].split("=")[1];
    const decodedB = jwt.decode(tokenValB);

    assert.notEqual(decodedA.jti, decodedB.jti, "Token ID must be rotated");

    // Verify Token A is marked as revoked in MongoDB and links to Token B
    const recordA = await RefreshToken.findOne({ tokenId: decodedA.jti });
    assert.ok(recordA.revokedAt, "Token A must be revoked");
    assert.equal(recordA.replacedByTokenId, decodedB.jti);

    // Verify Token B is active
    const recordB = await RefreshToken.findOne({ tokenId: decodedB.jti });
    assert.ok(recordB);
    assert.equal(recordB.revokedAt, null);
  });

  test("POST /api/auth/refresh detects replay attack: reusing revoked Token A invalidates family and rejects Token B", async () => {
    // 1. Initial Login -> Token A
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

    const cookieA = loginRes.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));

    // 2. Legitimate Refresh -> Token A revoked, Token B issued
    const refreshRes1 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [cookieA]);

    assert.equal(refreshRes1.status, 200);
    const cookieB = refreshRes1.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));

    // 3. Replay Attack: Attacker tries to use revoked Token A again
    const replayRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [cookieA]);

    assert.equal(replayRes.status, 401, "Replayed token must be rejected");

    // 4. Consequence: The entire token family should now be invalidated.
    // Token B (the legitimate replacement) must now ALSO be rejected.
    const refreshRes2 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [cookieB]);

    assert.equal(refreshRes2.status, 401, "Replacement Token B must also be rejected after replay detection");
  });

  test("POST /api/auth/refresh rejects missing, malformed, or invalid tokens", async () => {
    // Missing cookie
    const resMissing = await request(app).post("/api/auth/refresh");
    assert.equal(resMissing.status, 401);

    // Malformed token
    const resMalformed = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["al_basem_refresh_token=not-a-valid-jwt"]);
    assert.equal(resMalformed.status, 401);

    // Token signed with wrong secret
    const wrongSecretToken = jwt.sign(
      { sub: "some-user", jti: "some-id" },
      "wrong-secret-key-1234567890123456"
    );
    const resWrongSecret = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`al_basem_refresh_token=${wrongSecretToken}`]);
    assert.equal(resWrongSecret.status, 401);
  });

  test("POST /api/auth/logout revokes refresh token in database and clears HttpOnly cookie", async () => {
    // 1. Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

    const cookie = loginRes.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));
    const tokenVal = cookie.split(";")[0].split("=")[1];
    const decoded = jwt.decode(tokenVal);

    // 2. Logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [cookie]);

    assert.equal(logoutRes.status, 200);

    // Verify cookie cleared
    const clearedCookies = logoutRes.headers["set-cookie"];
    const clearedRefresh = clearedCookies.find((c) => c.startsWith("al_basem_refresh_token="));
    assert.ok(clearedRefresh.includes("al_basem_refresh_token=;"));

    // Verify token marked revoked in DB
    const record = await RefreshToken.findOne({ tokenId: decoded.jti });
    assert.ok(record.revokedAt);

    // 3. Subsequent refresh with that cookie must fail
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [cookie]);
    assert.equal(refreshRes.status, 401);
  });

  test("seedDefaultAdmin / syncDefaultAdmin creates admin on empty database with credentialsVersion=1", async () => {
    await User.deleteMany({});
    const initialCount = await User.countDocuments();
    assert.equal(initialCount, 0);

    await authService.syncDefaultAdmin();
    const createdUser = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
    assert.ok(createdUser);
    assert.equal(createdUser.role, "ADMIN");
    assert.equal(createdUser.isActive, true);
    assert.equal(createdUser.credentialsVersion, 1);

    const isMatch = await createdUser.comparePassword(env.ADMIN_PASSWORD);
    assert.equal(isMatch, true);
    assert.notEqual(createdUser.passwordHash, env.ADMIN_PASSWORD, "Password must not be plaintext");
    assert.ok(createdUser.passwordHash.startsWith("$2"), "Password must be bcrypt hash");
  });

  test("Restart with unchanged environment is idempotent (no DB modification, no password rehash, unchanged credentialsVersion)", async () => {
    const adminBefore = await User.findOne({ role: "ADMIN" });
    assert.ok(adminBefore);
    const initialPasswordHash = adminBefore.passwordHash;
    const initialCv = adminBefore.credentialsVersion;
    const initialUpdatedAt = adminBefore.updatedAt;

    // Run sync again with same env
    await authService.syncDefaultAdmin();

    const adminAfter = await User.findOne({ role: "ADMIN" });
    assert.equal(adminAfter.passwordHash, initialPasswordHash, "Password hash must not change if password unchanged");
    assert.equal(adminAfter.credentialsVersion, initialCv, "credentialsVersion must remain unchanged");
    assert.equal(adminAfter.updatedAt.getTime(), initialUpdatedAt.getTime(), "Document must not be updated if unchanged");

    const totalAdmins = await User.countDocuments({ role: "ADMIN" });
    assert.equal(totalAdmins, 1, "Exactly one admin must exist");
  });

  test("Email change synchronizes existing admin, updates login email, invalidates old email, and increments credentialsVersion", async () => {
    const originalEmail = env.ADMIN_EMAIL;
    const newEmail = "owner@albasem.ae";

    try {
      env.ADMIN_EMAIL = newEmail;
      await authService.syncDefaultAdmin();

      // Check DB admin
      const admin = await User.findOne({ role: "ADMIN" });
      assert.equal(admin.email, newEmail.toLowerCase());
      assert.equal(admin.credentialsVersion, 2);

      // Verify login with new email succeeds
      const newLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: newEmail, password: env.ADMIN_PASSWORD });
      assert.equal(newLogin.status, 200);

      // Verify login with old email fails
      const oldLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: originalEmail, password: env.ADMIN_PASSWORD });
      assert.equal(oldLogin.status, 401);

      const totalAdmins = await User.countDocuments({ role: "ADMIN" });
      assert.equal(totalAdmins, 1);
    } finally {
      env.ADMIN_EMAIL = originalEmail;
      await authService.syncDefaultAdmin();
    }
  });

  test("Password change synchronizes passwordHash, updates login password, rejects old password, and increments credentialsVersion", async () => {
    const originalPassword = env.ADMIN_PASSWORD;
    const newPassword = "NewSecurePassword@2026";

    try {
      env.ADMIN_PASSWORD = newPassword;
      await authService.syncDefaultAdmin();

      const admin = await User.findOne({ role: "ADMIN" });
      assert.equal(admin.credentialsVersion, 2);
      const isNewMatch = await admin.comparePassword(newPassword);
      assert.equal(isNewMatch, true);
      const isOldMatch = await admin.comparePassword(originalPassword);
      assert.equal(isOldMatch, false);

      // Login with new password succeeds
      const newLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: env.ADMIN_EMAIL, password: newPassword });
      assert.equal(newLogin.status, 200);

      // Login with old password fails
      const oldLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: env.ADMIN_EMAIL, password: originalPassword });
      assert.equal(oldLogin.status, 401);
    } finally {
      env.ADMIN_PASSWORD = originalPassword;
      await authService.syncDefaultAdmin();
    }
  });

  test("Both email and password change synchronizes both, increments credentialsVersion once, and rejects previous combinations", async () => {
    const originalEmail = env.ADMIN_EMAIL;
    const originalPassword = env.ADMIN_PASSWORD;
    const newEmail = "newadmin@albasem.ae";
    const newPassword = "AnotherSecurePassword@2026";

    try {
      env.ADMIN_EMAIL = newEmail;
      env.ADMIN_PASSWORD = newPassword;
      await authService.syncDefaultAdmin();

      const admin = await User.findOne({ role: "ADMIN" });
      assert.equal(admin.email, newEmail.toLowerCase());
      assert.equal(admin.credentialsVersion, 2);

      // 1. New email + new password -> SUCCESS
      const successRes = await request(app)
        .post("/api/auth/login")
        .send({ email: newEmail, password: newPassword });
      assert.equal(successRes.status, 200);

      // 2. Old email + old password -> FAILURE
      const resOldBoth = await request(app)
        .post("/api/auth/login")
        .send({ email: originalEmail, password: originalPassword });
      assert.equal(resOldBoth.status, 401);

      // 3. Old email + new password -> FAILURE
      const resOldEmailNewPass = await request(app)
        .post("/api/auth/login")
        .send({ email: originalEmail, password: newPassword });
      assert.equal(resOldEmailNewPass.status, 401);

      // 4. New email + old password -> FAILURE
      const resNewEmailOldPass = await request(app)
        .post("/api/auth/login")
        .send({ email: newEmail, password: originalPassword });
      assert.equal(resNewEmailOldPass.status, 401);

      const totalAdmins = await User.countDocuments({ role: "ADMIN" });
      assert.equal(totalAdmins, 1);
    } finally {
      env.ADMIN_EMAIL = originalEmail;
      env.ADMIN_PASSWORD = originalPassword;
      await authService.syncDefaultAdmin();
    }
  });

  test("Session invalidation: active access token and refresh token are immediately rejected after credential change", async () => {
    // 1. Initial Login to obtain active session
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });
    assert.equal(loginRes.status, 200);

    const oldAccessToken = loginRes.body.token;
    const cookie = loginRes.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));

    // Verify token works initially on protected route /api/auth/me
    const meBefore = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${oldAccessToken}`);
    assert.equal(meBefore.status, 200);

    // 2. Simulate .env credential change and backend restart / sync
    const originalPassword = env.ADMIN_PASSWORD;
    const newPassword = "ChangedSessionPass@2026";
    try {
      env.ADMIN_PASSWORD = newPassword;
      await authService.syncDefaultAdmin();

      // 3. Old access token on protected route must be rejected (401)
      const meAfter = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${oldAccessToken}`);
      assert.equal(meAfter.status, 401);
      assert.equal(meAfter.body.message, "User session invalid or deactivated");

      // 4. Old refresh token on /api/auth/refresh must be rejected (401)
      const refreshAfter = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [cookie]);
      assert.equal(refreshAfter.status, 401);

      // 5. New login with new credentials succeeds and provides valid session
      const newLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: env.ADMIN_EMAIL,
          password: newPassword
        });
      assert.equal(newLogin.status, 200);

      const newAccessToken = newLogin.body.token;
      const meNew = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${newAccessToken}`);
      assert.equal(meNew.status, 200);
    } finally {
      env.ADMIN_PASSWORD = originalPassword;
      await authService.syncDefaultAdmin();
    }
  });

  test("Multiple admin detection fails safely without corrupting database", async () => {
    // Create an extra admin user manually
    await User.create({
      name: "Second Admin",
      email: "secondadmin@albasem.ae",
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      role: "ADMIN",
      credentialsVersion: 1
    });

    const adminCount = await User.countDocuments({ role: "ADMIN" });
    assert.equal(adminCount, 2);

    // syncDefaultAdmin must throw a safe error refusing to guess or corrupt
    await assert.rejects(
      async () => {
        await authService.syncDefaultAdmin();
      },
      (err) => {
        return err.message.includes("Multiple administrator accounts detected in database");
      }
    );

    // Clean up the second admin
    await User.deleteOne({ email: "secondadmin@albasem.ae" });
  });

  test("Security verification: JWT payload contains no password or passwordHash", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

    const accessPayload = jwt.decode(loginRes.body.token);
    assert.equal(accessPayload.password, undefined);
    assert.equal(accessPayload.passwordHash, undefined);
    assert.ok(accessPayload.cv !== undefined, "Access token payload must include credentialsVersion (cv)");

    const cookie = loginRes.headers["set-cookie"].find((c) => c.startsWith("al_basem_refresh_token="));
    const tokenVal = cookie.split(";")[0].split("=")[1];
    const refreshPayload = jwt.decode(tokenVal);
    assert.equal(refreshPayload.password, undefined);
    assert.equal(refreshPayload.passwordHash, undefined);
  });
});
