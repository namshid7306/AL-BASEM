import mongoose from "mongoose";
import { Service } from "../models/Service.js";
import { Customer } from "../models/Customer.js";
import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { CompanySettings } from "../models/CompanySettings.js";
import { Notification } from "../models/Notification.js";
import { runWithTransaction } from "../utils/transaction.js";
import { calculateVatDetails, determineInvoiceStatus, roundHalfUp } from "../utils/money.js";
import { generateServiceNumber, generateInvoiceNumber, generatePaymentNumber } from "../utils/sequence.js";
import { recalculateCustomerFinancials } from "../utils/reconciliation.js";
import { AppError } from "../middleware/errorHandler.js";

export const serviceService = {
  getServices: async (query = {}) => {
    const { search, status, paymentStatus, startDate, endDate } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { serviceNumber: searchRegex },
        { customerName: searchRegex },
        { serviceType: searchRegex },
        { propertyAddress: searchRegex }
      ];
    }

    if (status && status !== "all") {
      filterConditions.status = status.toUpperCase();
    }

    if (paymentStatus && paymentStatus !== "all") {
      filterConditions.paymentStatus = paymentStatus.toUpperCase();
    }

    if (startDate || endDate) {
      filterConditions.scheduledDate = {};
      if (startDate) filterConditions.scheduledDate.$gte = new Date(startDate);
      if (endDate) filterConditions.scheduledDate.$lte = new Date(endDate);
    }

    const services = await Service.find(filterConditions)
      .populate("customerId", "customerType name phone address")
      .sort({ scheduledDate: -1 });
    return { services, total: services.length };
  },

  getServiceById: async (id) => {
    const service = await Service.findOne({ _id: id, isDeleted: false });
    if (!service) {
      throw new AppError("Service not found", 404);
    }

    const [customer, invoice, payments] = await Promise.all([
      Customer.findById(service.customerId),
      service.invoiceId ? Invoice.findById(service.invoiceId) : null,
      service.invoiceId ? Payment.find({ invoiceId: service.invoiceId, isDeleted: false }) : []
    ]);

    return { service, customer, invoice, payments };
  },

  createService: async (serviceData) => {
    return runWithTransaction(async (session) => {
      if (!serviceData.customerId) {
        throw new AppError("Customer ID is required to schedule a service", 400);
      }

      const customer = await Customer.findOne({ _id: serviceData.customerId, isDeleted: false }).session(session);
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }

      const rate = Number(serviceData.rate) || 0;
      const discount = Number(serviceData.discount) || 0;
      const rawSubtotal = Math.max(0, rate - discount);
      const vat = calculateVatDetails(rawSubtotal, 0.05, false);

      const paid = Number(serviceData.paidAmount) || 0;
      const balance = Math.max(0, roundHalfUp(vat.total - paid));
      let paymentStatus = "UNPAID";
      if (paid >= vat.total && vat.total > 0) paymentStatus = "PAID";
      else if (paid > 0) paymentStatus = "PARTIAL";

      if (!customer.address || !customer.address.trim()) {
        throw new AppError("Customer address is missing. Please update the customer profile before scheduling this service.", 400);
      }

      const serviceNumber = await generateServiceNumber(session);
      const propertyAddress = customer.address.trim();

      const newService = new Service({
        serviceNumber,
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        propertyAddress,
        serviceType: serviceData.serviceType,
        propertyType: serviceData.propertyType || "Villa",
        quantity: 1,
        rate,
        discount,
        subtotal: vat.subtotal,
        vatRate: 0.05,
        vatAmount: vat.vatAmount,
        totalAmount: vat.total,
        paidAmount: paid,
        balanceAmount: balance,
        paymentStatus,
        paymentMethod: serviceData.paymentMethod || "Cash",
        scheduledDate: new Date(serviceData.scheduledDate),
        status: serviceData.status || "UPCOMING",
        technicianNotes: serviceData.technicianNotes || ""
      });

      // Auto-generate Tax Invoice if requested
      if (serviceData.generateInvoice) {
        const invoiceNumber = await generateInvoiceNumber(session);
        const settings = await CompanySettings.findOne().session(session);

        const newInvoice = new Invoice({
          invoiceNumber,
          customerId: customer._id,
          serviceId: newService._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerTrn: customer.trn || "",
          customerAddress: propertyAddress,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          paymentTerms: settings?.paymentTerms || "Due on Receipt",
          lineItems: [
            {
              description: `${serviceData.serviceType} - ${propertyAddress}`,
              quantity: 1,
              rate,
              discount,
              amount: vat.subtotal,
              subtotal: vat.subtotal,
              vatRate: 0.05,
              taxRate: 5.0,
              vatAmount: vat.vatAmount,
              taxAmount: vat.vatAmount,
              totalAmount: vat.total
            }
          ],
          subtotal: vat.subtotal,
          vatRate: 0.05,
          vatAmount: vat.vatAmount,
          totalAmount: vat.total,
          paidAmount: paid,
          balanceAmount: balance,
          status: determineInvoiceStatus(vat.total, paid, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
          notes: serviceData.technicianNotes || settings?.defaultNotes || "Generated automatically from service order."
        });

        await newInvoice.save({ session });
        newService.invoiceId = newInvoice._id;

        // If payment was recorded during service setup
        if (paid > 0) {
          const paymentNumber = await generatePaymentNumber(session);
          const newPayment = new Payment({
            paymentNumber,
            invoiceId: newInvoice._id,
            invoiceNumber,
            customerId: customer._id,
            customerName: customer.name,
            amount: paid,
            paymentDate: new Date(),
            paymentMethod: serviceData.paymentMethod || "Cash",
            referenceNumber: `SVC-PAY-${Math.floor(100 + Math.random() * 900)}`,
            status: "COMPLETED",
            notes: "Payment recorded during service creation."
          });
          await newPayment.save({ session });
        }
      }

      await newService.save({ session });

      // Synchronize customer financial cache
      await recalculateCustomerFinancials(customer._id, session);

      return newService;
    });
  },

  updateService: async (id, serviceData) => {
    const existing = await Service.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      throw new AppError("Service not found", 404);
    }

    const updates = { ...serviceData };

    // If scheduledDate changes or status transitions to UPCOMING, reset reminderSentAt
    if (
      (serviceData.scheduledDate && new Date(serviceData.scheduledDate).getTime() !== new Date(existing.scheduledDate).getTime()) ||
      (serviceData.status === "UPCOMING" && existing.status !== "UPCOMING")
    ) {
      updates.reminderSentAt = null;
    }

    const service = await Service.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );
    return service;
  },

  deleteService: async (id) => {
    const service = await Service.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!service) {
      throw new AppError("Service not found", 404);
    }
    await recalculateCustomerFinancials(service.customerId);
    return { success: true };
  }
};
