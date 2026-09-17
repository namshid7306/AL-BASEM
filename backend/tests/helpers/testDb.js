import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { authService } from "../../src/services/authService.js";
import { settingsService } from "../../src/services/settingsService.js";

let replSet;

export const setupTestDB = async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);

  // Synchronize default admin and company settings
  await authService.syncDefaultAdmin();
  await settingsService.getSettings();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  // Re-synchronize essential defaults
  await authService.syncDefaultAdmin();
  await settingsService.getSettings();
};

export const teardownTestDB = async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
};
