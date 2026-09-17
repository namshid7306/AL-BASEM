import { Customer } from "../models/Customer.js";
import { Service } from "../models/Service.js";
import { Contract } from "../models/Contract.js";
import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { AppError } from "../middleware/errorHandler.js";
import { recalculateCustomerFinancials } from "../utils/reconciliation.js";

export const customerService = {
  getCustomers: async (query = {}) => {
    const { search, filter, page, limit } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { trn: searchRegex }
      ];
    }

    if (filter && filter !== "all") {
      if (filter === "active") {
        filterConditions.servicesCount = { $gt: 0 };
      } else if (filter === "monthly" || filter === "commercial") {
        filterConditions.customerType = { $regex: /commercial|office|building|restaurant|warehouse|hotel/i };
      } else if (filter === "residential" || filter === "one_time") {
        filterConditions.customerType = { $regex: /residential|villa|apartment/i };
      } else if (filter === "yearly") {
        filterConditions.$or = [
          { customerType: { $regex: /yearly|commercial/i } },
          { servicesCount: { $gte: 4 } }
        ];
      } else if (filter === "expiring") {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        filterConditions.nextServiceDate = { $gte: now, $lte: thirtyDaysLater };
      } else {
        filterConditions.customerType = new RegExp(`^${filter}$`, "i");
      }
    }

    const customers = await Customer.find(filterConditions).sort({ createdAt: -1 });
    const total = customers.length;

    return { customers, total };
  },

  getCustomerById: async (id) => {
    const customer = await Customer.findOne({ _id: id, isDeleted: false });
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const [services, contracts, invoices, payments] = await Promise.all([
      Service.find({ customerId: id, isDeleted: false }).sort({ scheduledDate: -1 }),
      Contract.find({ customerId: id, isDeleted: false }).sort({ createdAt: -1 }),
      Invoice.find({ customerId: id, isDeleted: false }).sort({ createdAt: -1 }),
      Payment.find({ customerId: id, isDeleted: false }).sort({ paymentDate: -1 })
    ]);

    return {
      customer,
      services,
      contracts,
      invoices,
      payments
    };
  },

  createCustomer: async (data, session = null) => {
    const customer = new Customer({
      ...data,
      totalRevenue: 0,
      outstandingBalance: 0,
      paidTotal: 0,
      servicesCount: 0
    });
    await customer.save({ session });
    return customer;
  },

  updateCustomer: async (id, data) => {
    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }
    return customer;
  },

  deleteCustomer: async (id) => {
    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }
    return { success: true };
  }
};
