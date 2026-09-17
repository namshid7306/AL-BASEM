import mongoose from "mongoose";
import { Quotation } from "../models/Quotation.js";
import { Customer } from "../models/Customer.js";
import { Invoice } from "../models/Invoice.js";
import { CompanySettings } from "../models/CompanySettings.js";
import { runWithTransaction } from "../utils/transaction.js";;
import { generateQuoteNumber, generateInvoiceNumber } from "../utils/sequence.js";
import { calculateDocumentTotals, determineInvoiceStatus } from "../utils/money.js";
import { recalculateCustomerFinancials } from "../utils/reconciliation.js";
import { AppError } from "../middleware/errorHandler.js";

export const quotationService = {
  getQuotations: async (query = {}) => {
    const { search, status } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { quoteNumber: searchRegex },
        { customerName: searchRegex },
        { subject: searchRegex }
      ];
    }

    if (status && status !== "all") {
      filterConditions.status = status.toUpperCase();
    }

    const quotations = await Quotation.find(filterConditions).sort({ date: -1 });
    return { quotations, total: quotations.length };
  },

  getQuotationById: async (id) => {
    const quotation = await Quotation.findOne({ _id: id, isDeleted: false });
    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }
    const customer = await Customer.findById(quotation.customerId);
    return { quotation, customer };
  },

  createQuotation: async (quoteData) => {
    const customer = await Customer.findOne({ _id: quoteData.customerId, isDeleted: false });
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const settings = await CompanySettings.findOne();
    const quoteNumber = await generateQuoteNumber();
    const totals = calculateDocumentTotals(quoteData.lineItems || [], 0.05, false);

    const quoteDate = quoteData.date ? new Date(quoteData.date) : new Date();
    const validUntil = quoteData.validUntil
      ? new Date(quoteData.validUntil)
      : new Date(quoteDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newQuotation = new Quotation({
      quoteNumber,
      customerId: customer._id,
      customerName: quoteData.customerName || customer.name,
      customerEmail: quoteData.customerEmail || customer.email || "",
      customerPhone: quoteData.customerPhone || customer.phone || "",
      address: quoteData.address || customer.address || "",
      subject: quoteData.subject || "Pest Control Services Quotation",
      date: quoteDate,
      validUntil,
      status: quoteData.status || "SENT",
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      grandTotal: totals.totalAmount,
      notes: quoteData.notes || settings?.defaultNotes || "Thanks for your business."
    });

    await newQuotation.save();
    return newQuotation;
  },

  convertToInvoice: async (id) => {
    return runWithTransaction(async (session) => {
      const quotation = await Quotation.findOne({ _id: id, isDeleted: false }).session(session);
      if (!quotation) {
        throw new AppError("Quotation not found", 404);
      }

      if (quotation.status === "ACCEPTED" || quotation.convertedInvoiceId) {
        throw new AppError("Quotation has already been converted to an invoice", 409);
      }

      const settings = await CompanySettings.findOne().session(session);
      const invoiceNumber = await generateInvoiceNumber(session);

      const newInvoice = new Invoice({
        invoiceNumber,
        customerId: quotation.customerId,
        quotationId: quotation._id,
        customerName: quotation.customerName,
        customerPhone: quotation.customerPhone,
        customerTrn: "",
        customerAddress: quotation.address,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        paymentTerms: settings?.paymentTerms || "Due on Receipt",
        lineItems: quotation.lineItems,
        subtotal: quotation.subtotal,
        vatRate: quotation.vatRate,
        vatAmount: quotation.vatAmount,
        totalAmount: quotation.grandTotal,
        paidAmount: 0,
        balanceAmount: quotation.grandTotal,
        status: determineInvoiceStatus(quotation.grandTotal, 0, new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)),
        notes: `Converted from Quotation ${quotation.quoteNumber}`
      });

      await newInvoice.save({ session });

      quotation.status = "ACCEPTED";
      quotation.convertedInvoiceId = newInvoice._id;
      quotation.convertedAt = new Date();
      await quotation.save({ session });

      await recalculateCustomerFinancials(quotation.customerId, session);

      return { quotation, invoice: newInvoice };
    });
  }
};
