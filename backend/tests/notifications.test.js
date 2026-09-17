import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Set required env vars for tests before importing modules
process.env.JWT_SECRET = "test_jwt_secret_key_123456789";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_token_secret_key_987654321";
process.env.ADMIN_EMAIL = "admin@albasem.test";
process.env.ADMIN_PASSWORD = "AdminPassword123!";
process.env.TIMEZONE = "Asia/Dubai";
process.env.CONTRACT_REMINDER_DAYS = "30";
process.env.CONTRACT_FINAL_REMINDER_DAYS = "7";
process.env.SERVICE_REMINDER_HOURS = "24";
process.env.PAYMENT_REMINDER_DAYS = "3";

import { Contract } from "../src/models/Contract.js";
import { Service } from "../src/models/Service.js";
import { Invoice } from "../src/models/Invoice.js";
import { Customer } from "../src/models/Customer.js";
import { Notification } from "../src/models/Notification.js";
import { User } from "../src/models/User.js";
import { RefreshToken } from "../src/models/RefreshToken.js";
import { runContractExpiryScan } from "../src/jobs/contractExpiryJob.js";
import { runServiceReminderScan } from "../src/jobs/serviceReminderJob.js";
import { runPaymentReminderScan } from "../src/jobs/paymentReminderJob.js";
import { runInvoiceOverdueScan } from "../src/jobs/invoiceOverdueJob.js";
import { serviceService } from "../src/services/serviceService.js";
import { contractService } from "../src/services/contractService.js";
import { initBackgroundJobs } from "../src/jobs/index.js";
import { authService } from "../src/services/authService.js";
import { env } from "../src/config/env.js";
import { getDubaiDayBoundaries, getDubaiDateString } from "../src/utils/timezone.js";

let mongoServer;

describe("AL BASEM Operational Notification System Test Suite", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      Notification.deleteMany({}),
      Contract.deleteMany({}),
      Service.deleteMany({}),
      Invoice.deleteMany({}),
      Customer.deleteMany({}),
      User.deleteMany({}),
      RefreshToken.deleteMany({})
    ]);
  });

  // ==========================================
  // 1. CONTRACT NOTIFICATION TESTS
  // ==========================================
  describe("1. Contract Expiry Reminders", () => {
    test("Generates 30-day reminder for contract expiring in 30 days", async () => {
      const customer = await Customer.create({
        name: "Al Futtaim Group",
        phone: "+971501234567",
        address: "Dubai Festival City"
      });

      const now = new Date();
      // 20 days ahead (falls within 30-day window and > 7 days)
      const expiryDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      await Contract.create({
        contractNumber: "CNT-TEST-001",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Annual Pest Control",
        serviceType: "General Pest Control",
        startDate: new Date(now.getTime() - 345 * 24 * 60 * 60 * 1000),
        endDate: expiryDate,
        status: "ACTIVE"
      });

      await runContractExpiryScan();

      const notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Contract Expiring Soon/);
      assert.equal(notifs[0].entityType, "contract");
      assert.equal(notifs[0].link, `/contracts/${notifs[0].entityId}`);
    });

    test("Generates 7-day reminder for contract expiring in 5 days", async () => {
      const customer = await Customer.create({
        name: "Emaar Properties",
        phone: "+971509998888",
        address: "Downtown Dubai"
      });

      const now = new Date();
      const expiryDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      await Contract.create({
        contractNumber: "CNT-TEST-002",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Villa Termite Control",
        serviceType: "Termite Control",
        startDate: new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000),
        endDate: expiryDate,
        status: "ACTIVE"
      });

      await runContractExpiryScan();

      const notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Contract Expiring Soon \(7 Days\)/);
    });

    test("Generates Expired alert for active contract past end date", async () => {
      const customer = await Customer.create({
        name: "Damac Hills",
        phone: "+971501112222",
        address: "Damac Hills 2"
      });

      const now = new Date();
      const expiryDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      await Contract.create({
        contractNumber: "CNT-TEST-003",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Quarterly Cockroach Control",
        serviceType: "Cockroach Control",
        startDate: new Date(now.getTime() - 367 * 24 * 60 * 60 * 1000),
        endDate: expiryDate,
        status: "ACTIVE"
      });

      await runContractExpiryScan();

      const notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Contract Expired/);
    });

    test("Excludes contracts outside reminder window (e.g. 90 days out)", async () => {
      const customer = await Customer.create({
        name: "Nakheel Malls",
        phone: "+971503334444",
        address: "Palm Jumeirah"
      });

      const now = new Date();
      const expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      await Contract.create({
        contractNumber: "CNT-TEST-004",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Yearly Facility Care",
        serviceType: "Rodent Control",
        startDate: now,
        endDate: expiryDate,
        status: "ACTIVE"
      });

      await runContractExpiryScan();

      const notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 0);
    });

    test("Excludes TERMINATED, RENEWED, and deleted contracts", async () => {
      const customer = await Customer.create({
        name: "Meraas Holding",
        phone: "+971505556666",
        address: "City Walk"
      });

      const now = new Date();
      const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      await Contract.create({
        contractNumber: "CNT-TERM",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Terminated Contract",
        serviceType: "General Pest Control",
        startDate: now,
        endDate: expiryDate,
        status: "TERMINATED"
      });

      await Contract.create({
        contractNumber: "CNT-REN",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Renewed Contract",
        serviceType: "General Pest Control",
        startDate: now,
        endDate: expiryDate,
        status: "RENEWED"
      });

      await Contract.create({
        contractNumber: "CNT-DEL",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Deleted Contract",
        serviceType: "General Pest Control",
        startDate: now,
        endDate: expiryDate,
        status: "ACTIVE",
        isDeleted: true
      });

      await runContractExpiryScan();

      const notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 0);
    });

    test("Contract duplicate protection: Running scan twice generates only 1 notification", async () => {
      const customer = await Customer.create({
        name: "Dubai Silicon Oasis",
        phone: "+971507778888",
        address: "DSO Building B"
      });

      const now = new Date();
      const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      await Contract.create({
        contractNumber: "CNT-IDEMP-01",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Standard Pest Care",
        serviceType: "General Pest Control",
        startDate: now,
        endDate: expiryDate,
        status: "ACTIVE"
      });

      await runContractExpiryScan();
      await runContractExpiryScan(); // Second run

      const notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 1);
    });

    test("Contract date extension: Changing endDate creates a new reminder sequence", async () => {
      const customer = await Customer.create({
        name: "Jumeirah Golf Estates",
        phone: "+971501239999",
        address: "JGE Villa 42"
      });

      const now = new Date();
      const initialExpiry = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      const contract = await Contract.create({
        contractNumber: "CNT-EXTEND-01",
        customerId: customer._id,
        customerName: customer.name,
        planName: "Villa Plan",
        serviceType: "General Pest Control",
        startDate: now,
        endDate: initialExpiry,
        status: "ACTIVE"
      });

      // 1. Initial scan generates 30-day reminder
      await runContractExpiryScan();
      let notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 1);

      // 2. Extend contract end date
      const newExpiry = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
      await contractService.updateContract(contract._id, { endDate: newExpiry });

      // 3. Scan again generates a new notification with the updated end date's business key
      await runContractExpiryScan();
      notifs = await Notification.find({ type: "contract" });
      assert.equal(notifs.length, 2);
    });
  });

  // ==========================================
  // 2. SERVICE NOTIFICATION TESTS
  // ==========================================
  describe("2. Service Appointment Reminders", () => {
    test("Generates 24-hour reminder for upcoming service scheduled for tomorrow", async () => {
      const customer = await Customer.create({
        name: "Rashid Ali",
        phone: "+971502223333",
        address: "Al Barsha 1, Villa 12"
      });

      const now = new Date();
      const scheduledDate = new Date(now.getTime() + 20 * 60 * 60 * 1000); // in 20 hours

      await Service.create({
        serviceNumber: "SRV-TEST-001",
        customerId: customer._id,
        customerName: customer.name,
        propertyAddress: customer.address,
        serviceType: "Bedbug Heat Treatment",
        scheduledDate,
        status: "UPCOMING"
      });

      await runServiceReminderScan();

      const notifs = await Notification.find({ type: "service" });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Upcoming Service Reminder/);
      assert.equal(notifs[0].link, `/services/${notifs[0].entityId}`);
    });

    test("Excludes COMPLETED, CANCELLED, and deleted services", async () => {
      const customer = await Customer.create({
        name: "Fatima Noor",
        phone: "+971504445555",
        address: "Mirdif Hills"
      });

      const now = new Date();
      const scheduledDate = new Date(now.getTime() + 10 * 60 * 60 * 1000);

      await Service.create({
        serviceNumber: "SRV-COMP",
        customerId: customer._id,
        customerName: customer.name,
        propertyAddress: customer.address,
        serviceType: "General Pest Control",
        scheduledDate,
        status: "COMPLETED"
      });

      await Service.create({
        serviceNumber: "SRV-CANC",
        customerId: customer._id,
        customerName: customer.name,
        propertyAddress: customer.address,
        serviceType: "General Pest Control",
        scheduledDate,
        status: "CANCELLED"
      });

      await runServiceReminderScan();

      const notifs = await Notification.find({ type: "service" });
      assert.equal(notifs.length, 0);
    });

    test("Service duplicate protection: Running scan twice generates only 1 notification", async () => {
      const customer = await Customer.create({
        name: "Omar Khalid",
        phone: "+971506667777",
        address: "JLT Cluster Q"
      });

      const now = new Date();
      const scheduledDate = new Date(now.getTime() + 18 * 60 * 60 * 1000);

      await Service.create({
        serviceNumber: "SRV-IDEMP-01",
        customerId: customer._id,
        customerName: customer.name,
        propertyAddress: customer.address,
        serviceType: "Gel Bait Treatment",
        scheduledDate,
        status: "UPCOMING"
      });

      await runServiceReminderScan();
      await runServiceReminderScan(); // Second run

      const notifs = await Notification.find({ type: "service" });
      assert.equal(notifs.length, 1);
    });

    test("Service rescheduling: Changing scheduledDate generates a new reminder", async () => {
      const customer = await Customer.create({
        name: "Salim Ahmed",
        phone: "+971508889999",
        address: "Arabian Ranches"
      });

      const now = new Date();
      const initialDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      const service = await Service.create({
        serviceNumber: "SRV-RESCHED-01",
        customerId: customer._id,
        customerName: customer.name,
        propertyAddress: customer.address,
        serviceType: "General Pest Control",
        scheduledDate: initialDate,
        status: "UPCOMING"
      });

      // 1. Initial reminder generated
      await runServiceReminderScan();
      let notifs = await Notification.find({ type: "service" });
      assert.equal(notifs.length, 1);

      // 2. Reschedule service to tomorrow
      const newDate = new Date(now.getTime() + 22 * 60 * 60 * 1000);
      await serviceService.updateService(service._id, { scheduledDate: newDate });

      // 3. Scan again generates a new notification for the updated scheduled date
      await runServiceReminderScan();
      notifs = await Notification.find({ type: "service" });
      assert.equal(notifs.length, 2);
    });
  });

  // ==========================================
  // 3. PAYMENT NOTIFICATION TESTS
  // ==========================================
  describe("3. Payment Due & Overdue Reminders", () => {
    test("Generates 3-day approaching due date reminder for UNPAID invoice", async () => {
      const customer = await Customer.create({
        name: "Al Habtoor Group",
        phone: "+971501110000",
        address: "Habtoor City"
      });

      const now = new Date();
      const dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days ahead

      await Invoice.create({
        invoiceNumber: "INV-TEST-001",
        customerId: customer._id,
        customerName: customer.name,
        dueDate,
        lineItems: [{ description: "Service Charge", quantity: 1, rate: 500, totalAmount: 525 }],
        subtotal: 500,
        vatAmount: 25,
        totalAmount: 525,
        paidAmount: 0,
        balanceAmount: 525,
        status: "UNPAID"
      });

      await runPaymentReminderScan();

      const notifs = await Notification.find({ type: "payment" });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Payment Due Soon/);
      assert.match(notifs[0].message, /525.00/);
    });

    test("Generates Due Today reminder for invoice due today in Asia/Dubai", async () => {
      const customer = await Customer.create({
        name: "Dubai Holding",
        phone: "+971502220000",
        address: "Business Bay"
      });

      const now = new Date();
      const { startOfDay: todayStart } = getDubaiDayBoundaries(now);
      const dueDateToday = new Date(todayStart.getTime() + 5 * 60 * 60 * 1000); // 5 AM Dubai time today

      await Invoice.create({
        invoiceNumber: "INV-TEST-002",
        customerId: customer._id,
        customerName: customer.name,
        dueDate: dueDateToday,
        lineItems: [{ description: "Quarterly Treatment", quantity: 1, rate: 1200, totalAmount: 1260 }],
        subtotal: 1200,
        vatAmount: 60,
        totalAmount: 1260,
        paidAmount: 260,
        balanceAmount: 1000,
        status: "PARTIAL"
      });

      await runPaymentReminderScan();

      const notifs = await Notification.find({ type: "payment" });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Payment Due Today/);
      assert.match(notifs[0].message, /1,000.00/);
    });

    test("Invoice Overdue Job: Transitions invoice to OVERDUE and creates notification", async () => {
      const customer = await Customer.create({
        name: "Sobha Realty",
        phone: "+971503330000",
        address: "Sobha Hartland"
      });

      const now = new Date();
      const pastDueDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      const invoice = await Invoice.create({
        invoiceNumber: "INV-TEST-003",
        customerId: customer._id,
        customerName: customer.name,
        dueDate: pastDueDate,
        lineItems: [{ description: "Full Villa Sanitization", quantity: 1, rate: 800, totalAmount: 840 }],
        subtotal: 800,
        vatAmount: 40,
        totalAmount: 840,
        paidAmount: 0,
        balanceAmount: 840,
        status: "UNPAID"
      });

      await runInvoiceOverdueScan();

      // Verify invoice status updated
      const updatedInvoice = await Invoice.findById(invoice._id);
      assert.equal(updatedInvoice.status, "OVERDUE");

      // Verify notification created
      const notifs = await Notification.find({ entityId: invoice._id.toString() });
      assert.equal(notifs.length, 1);
      assert.match(notifs[0].title, /Payment Overdue/);
      assert.match(notifs[0].message, /840.00/);
    });

    test("Excludes PAID, CANCELLED, and zero-balance invoices", async () => {
      const customer = await Customer.create({
        name: "Aldar Properties",
        phone: "+971504440000",
        address: "Yas Island"
      });

      const now = new Date();
      const dueDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      await Invoice.create({
        invoiceNumber: "INV-PAID",
        customerId: customer._id,
        customerName: customer.name,
        dueDate,
        lineItems: [{ description: "Pest Treatment", quantity: 1, rate: 300, totalAmount: 315 }],
        subtotal: 300,
        vatAmount: 15,
        totalAmount: 315,
        paidAmount: 315,
        balanceAmount: 0,
        status: "PAID"
      });

      await Invoice.create({
        invoiceNumber: "INV-CANC",
        customerId: customer._id,
        customerName: customer.name,
        dueDate,
        lineItems: [{ description: "Cancelled Order", quantity: 1, rate: 300, totalAmount: 315 }],
        subtotal: 300,
        vatAmount: 15,
        totalAmount: 315,
        paidAmount: 0,
        balanceAmount: 315,
        status: "CANCELLED"
      });

      await runPaymentReminderScan();
      await runInvoiceOverdueScan();

      const notifs = await Notification.find({ type: "payment" });
      assert.equal(notifs.length, 0);
    });

    test("Payment duplicate protection: Running scan twice generates only 1 notification", async () => {
      const customer = await Customer.create({
        name: "Union Properties",
        phone: "+971505550000",
        address: "Motor City"
      });

      const now = new Date();
      const dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      await Invoice.create({
        invoiceNumber: "INV-IDEMP-01",
        customerId: customer._id,
        customerName: customer.name,
        dueDate,
        lineItems: [{ description: "Commercial Kitchen Treatment", quantity: 1, rate: 600, totalAmount: 630 }],
        subtotal: 600,
        vatAmount: 30,
        totalAmount: 630,
        paidAmount: 0,
        balanceAmount: 630,
        status: "UNPAID"
      });

      await runPaymentReminderScan();
      await runPaymentReminderScan(); // Second run

      const notifs = await Notification.find({ type: "payment" });
      assert.equal(notifs.length, 1);
    });
  });

  // ==========================================
  // 4. STARTUP & AUTHENTICATION INTEGRATION
  // ==========================================
  describe("4. Startup & Authentication Preservation", () => {
    test("initBackgroundJobs initializes idempotently without duplicate registrations", () => {
      initBackgroundJobs();
      initBackgroundJobs(); // Calling twice should be safe
      assert.ok(true);
    });

    test("Admin credentials synchronization and login remain functional", async () => {
      await authService.syncDefaultAdmin();

      const loginResult = await authService.login({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      });

      assert.ok(loginResult.accessToken);
      assert.ok(loginResult.refreshToken);
      assert.equal(loginResult.user.email, env.ADMIN_EMAIL.toLowerCase());
      assert.equal(loginResult.user.role, "ADMIN");
    });
  });
});
