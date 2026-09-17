import { Customer } from "../models/Customer.js";
import { Service } from "../models/Service.js";
import { Invoice } from "../models/Invoice.js";
import { Quotation } from "../models/Quotation.js";
import { Expense } from "../models/Expense.js";

export const searchService = {
  globalSearch: async (q = "") => {
    if (!q || !q.trim()) {
      return { customers: [], services: [], invoices: [], quotations: [], expenses: [] };
    }

    const regex = new RegExp(q.trim(), "i");

    const [customers, services, invoices, quotations, expenses] = await Promise.all([
      Customer.find({
        isDeleted: false,
        $or: [{ name: regex }, { phone: regex }, { company: regex }, { trn: regex }]
      })
        .limit(5)
        .select("_id name phone company trn customerType"),

      Service.find({
        isDeleted: false,
        $or: [{ serviceNumber: regex }, { customerName: regex }, { serviceType: regex }, { propertyAddress: regex }]
      })
        .limit(5)
        .select("_id serviceNumber customerName serviceType status totalAmount scheduledDate"),

      Invoice.find({
        isDeleted: false,
        $or: [{ invoiceNumber: regex }, { customerName: regex }, { customerTrn: regex }]
      })
        .limit(5)
        .select("_id invoiceNumber customerName totalAmount balanceAmount status invoiceDate"),

      Quotation.find({
        isDeleted: false,
        $or: [{ quoteNumber: regex }, { customerName: regex }, { subject: regex }]
      })
        .limit(5)
        .select("_id quoteNumber customerName grandTotal status date"),

      Expense.find({
        isDeleted: false,
        $or: [{ description: regex }, { categoryName: regex }, { notes: regex }]
      })
        .limit(5)
        .select("_id description categoryName amount date")
    ]);

    return {
      customers,
      services,
      invoices,
      quotations,
      expenses
    };
  }
};
