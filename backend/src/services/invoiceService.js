import mongoose from "mongoose";
import { Invoice } from "../models/Invoice.js";
import { Customer } from "../models/Customer.js";
import { Payment } from "../models/Payment.js";
import { CompanySettings } from "../models/CompanySettings.js";
import { runWithTransaction } from "../utils/transaction.js";;
import { generateInvoiceNumber } from "../utils/sequence.js";
import { calculateDocumentTotals, determineInvoiceStatus } from "../utils/money.js";
import { recalculateCustomerFinancials } from "../utils/reconciliation.js";
import { AppError } from "../middleware/errorHandler.js";

export const invoiceService = {
  getInvoices: async (query = {}) => {
    const { search, status } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { invoiceNumber: searchRegex },
        { customerName: searchRegex },
        { customerTrn: searchRegex }
      ];
    }

    if (status && status !== "all") {
      filterConditions.status = status.toUpperCase();
    }

    const invoices = await Invoice.find(filterConditions).sort({ invoiceDate: -1 });
    return { invoices, total: invoices.length };
  },

  getInvoiceById: async (id) => {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    const [customer, payments, companySettings] = await Promise.all([
      Customer.findById(invoice.customerId),
      Payment.find({ invoiceId: invoice._id, isDeleted: false }).sort({ paymentDate: -1 }),
      CompanySettings.findOne()
    ]);

    return { invoice, customer, payments, companySettings };
  },

  createInvoice: async (invoiceData) => {
    return runWithTransaction(async (session) => {
      const customer = await Customer.findOne({ _id: invoiceData.customerId, isDeleted: false }).session(session);
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }

      const settings = await CompanySettings.findOne().session(session);
      const invoiceNumber = await generateInvoiceNumber(session);
      const totals = calculateDocumentTotals(invoiceData.lineItems || [], 0.05, false);

      const invoiceDate = invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date();
      const dueDate = invoiceData.dueDate
        ? new Date(invoiceData.dueDate)
        : new Date(invoiceDate.getTime() + 15 * 24 * 60 * 60 * 1000);

      const newInvoice = new Invoice({
        invoiceNumber,
        customerId: customer._id,
        serviceId: invoiceData.serviceId || null,
        quotationId: invoiceData.quotationId || null,
        customerName: invoiceData.customerName || customer.name,
        customerPhone: invoiceData.customerPhone || customer.phone,
        customerTrn: invoiceData.customerTrn || customer.trn || "",
        customerAddress: invoiceData.customerAddress || customer.address,
        invoiceDate,
        dueDate,
        paymentTerms: invoiceData.paymentTerms || settings?.paymentTerms || "Due on Receipt",
        lineItems: totals.lineItems,
        subtotal: totals.subtotal,
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        balanceAmount: totals.totalAmount,
        status: determineInvoiceStatus(totals.totalAmount, 0, dueDate),
        notes: invoiceData.notes || settings?.defaultNotes || "Thanks for your business."
      });

      await newInvoice.save({ session });
      await recalculateCustomerFinancials(customer._id, session);

      return newInvoice;
    });
  }
};
