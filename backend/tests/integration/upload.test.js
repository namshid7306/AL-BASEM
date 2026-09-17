import { test, describe, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import app from "../../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "../helpers/testDb.js";
import { env } from "../../src/config/env.js";
import { UploadedFile } from "../../src/models/UploadedFile.js";

describe("Upload Security Integration Tests", () => {
  let authToken;
  const createdTestFilePaths = [];

  const cleanupTestFiles = () => {
    while (createdTestFilePaths.length > 0) {
      const filePath = createdTestFilePaths.pop();
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        // Silently ignore cleanup errors on non-existent files
      }
    }
  };

  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    cleanupTestFiles();
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

  afterEach(async () => {
    cleanupTestFiles();
    try {
      await UploadedFile.deleteMany({});
    } catch {
      // Test DB might already be disconnecting
    }
  });

  test("POST /api/upload rejects unauthenticated uploads with 401", async () => {
    const res = await request(app).post("/api/upload");
    assert.equal(res.status, 401);
  });

  test("POST /api/upload accepts valid PNG file buffer and returns secure URL", async () => {
    // 1x1 PNG transparent pixel buffer with valid magic bytes
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", pngBuffer, "receipt.png");

    assert.equal(res.status, 201);
    assert.ok(res.body.url);
    assert.equal(res.body.file.mimeType, "image/png");

    // Track the generated file path for guaranteed cleanup
    if (res.body.url) {
      const storedFilename = path.basename(res.body.url);
      const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, storedFilename);
      createdTestFilePaths.push(filePath);
    }

    // Authenticated access to retrieve file
    const fileRes = await request(app)
      .get(res.body.url)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(fileRes.status, 200);

    // Unauthenticated access to retrieve file must be rejected (401)
    const unauthRes = await request(app).get(res.body.url);
    assert.equal(unauthRes.status, 401);
  });
});
