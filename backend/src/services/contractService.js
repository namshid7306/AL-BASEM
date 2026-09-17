import mongoose from "mongoose";
import { Contract } from "../models/Contract.js";
import { Customer } from "../models/Customer.js";
import { Service } from "../models/Service.js";
import { runWithTransaction } from "../utils/transaction.js";;
import { generateContractNumber, generateServiceNumber } from "../utils/sequence.js";
import { calculateContractVisitDates } from "../utils/schedule.js";
import { roundHalfUp, calculateVatDetails } from "../utils/money.js";
import { recalculateCustomerFinancials } from "../utils/reconciliation.js";
import { AppError } from "../middleware/errorHandler.js";

export const contractService = {
  getContracts: async (query = {}) => {
    const { search, status, serviceFrequency, paymentFrequency } = query;
    const filterConditions = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.$or = [
        { contractNumber: searchRegex },
        { customerName: searchRegex },
        { planName: searchRegex },
        { serviceType: searchRegex }
      ];
    }

    if (status && status !== "all") {
      if (status.toUpperCase() === "EXPIRING") {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        filterConditions.status = "ACTIVE";
        filterConditions.endDate = { $gte: now, $lte: thirtyDaysLater };
      } else {
        filterConditions.status = status.toUpperCase();
      }
    }

    if (serviceFrequency && serviceFrequency !== "all") {
      filterConditions.serviceFrequency = serviceFrequency;
    }

    if (paymentFrequency && paymentFrequency !== "all") {
      filterConditions.paymentFrequency = paymentFrequency;
    }

    const contracts = await Contract.find(filterConditions).sort({ createdAt: -1 });
    return { contracts, total: contracts.length };
  },

  getContractById: async (id) => {
    const contract = await Contract.findOne({ _id: id, isDeleted: false });
    if (!contract) {
      throw new AppError("Contract not found", 404);
    }

    const [customer, services] = await Promise.all([
      Customer.findById(contract.customerId),
      Service.find({ contractId: contract._id, isDeleted: false }).sort({ scheduledDate: 1 })
    ]);

    return { contract, customer, services };
  },

  createContract: async (contractData) => {
    return runWithTransaction(async (session) => {
      const customer = await Customer.findOne({ _id: contractData.customerId, isDeleted: false }).session(session);
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }

      const totalVisits = Number(contractData.totalVisits) || 12;
      const totalAmount = Number(contractData.totalAmount) || 0;
      const contractNumber = await generateContractNumber(session);

      const startDate = new Date(contractData.startDate || Date.now());
      const endDate = contractData.endDate ? new Date(contractData.endDate) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      const newContract = new Contract({
        contractNumber,
        customerId: customer._id,
        customerName: customer.name,
        planName: contractData.planName || "Pest Control Plan",
        serviceType: contractData.serviceType,
        propertyType: contractData.propertyType || "Villa",
        startDate,
        endDate,
        serviceFrequency: contractData.serviceFrequency || "monthly",
        paymentFrequency: contractData.paymentFrequency || "quarterly",
        totalVisits,
        completedVisits: 0,
        totalAmount,
        status: "ACTIVE",
        notes: contractData.notes || "",
        historicalVersion: 1
      });

      await newContract.save({ session });

      // Generate scheduled visits
      const visitDates = calculateContractVisitDates(
        startDate,
        endDate,
        contractData.serviceFrequency || "monthly",
        totalVisits
      );

      const perVisitRate = totalVisits > 0 ? roundHalfUp(totalAmount / totalVisits) : 0;
      const visitVat = calculateVatDetails(perVisitRate, 0.05, false);

      for (let i = 0; i < visitDates.length; i++) {
        const serviceNumber = await generateServiceNumber(session);
        const scheduledService = new Service({
          serviceNumber,
          customerId: customer._id,
          contractId: newContract._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          propertyAddress: customer.address,
          serviceType: newContract.serviceType,
          propertyType: newContract.propertyType,
          quantity: 1,
          rate: perVisitRate,
          discount: 0,
          subtotal: visitVat.subtotal,
          vatAmount: visitVat.vatAmount,
          totalAmount: visitVat.total,
          paidAmount: 0,
          balanceAmount: visitVat.total,
          paymentStatus: "UNPAID",
          paymentMethod: "Cash",
          scheduledDate: visitDates[i],
          status: "UPCOMING",
          technicianNotes: `Contract Visit #${i + 1} (${newContract.contractNumber})`
        });
        await scheduledService.save({ session });
      }

      await recalculateCustomerFinancials(customer._id, session);
      return newContract;
    });
  },

  renewContract: async (id, renewalData) => {
    return runWithTransaction(async (session) => {
      const prev = await Contract.findOne({ _id: id, isDeleted: false }).session(session);
      if (!prev) {
        throw new AppError("Contract not found", 404);
      }

      // Mark old contract as RENEWED (preserve historical record)
      prev.status = "RENEWED";
      await prev.save({ session });

      const newVersion = (prev.historicalVersion || 1) + 1;
      const contractNumber = `${prev.contractNumber.split("-R")[0]}-R${newVersion}`;

      const totalVisits = Number(renewalData.totalVisits) || prev.totalVisits;
      const totalAmount = Number(renewalData.totalAmount) || prev.totalAmount;
      const startDate = new Date(renewalData.startDate || Date.now());
      const endDate = renewalData.endDate ? new Date(renewalData.endDate) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      const newContract = new Contract({
        contractNumber,
        customerId: prev.customerId,
        customerName: prev.customerName,
        planName: renewalData.planName || prev.planName,
        serviceType: renewalData.serviceType || prev.serviceType,
        propertyType: prev.propertyType,
        startDate,
        endDate,
        serviceFrequency: renewalData.serviceFrequency || prev.serviceFrequency,
        paymentFrequency: renewalData.paymentFrequency || prev.paymentFrequency,
        totalVisits,
        completedVisits: 0,
        totalAmount,
        status: "ACTIVE",
        notes: renewalData.notes || `Renewed from ${prev.contractNumber}`,
        historicalVersion: newVersion,
        previousContractId: prev._id
      });

      await newContract.save({ session });

      // Generate new cycle visits
      const visitDates = calculateContractVisitDates(
        startDate,
        endDate,
        newContract.serviceFrequency,
        totalVisits
      );

      const perVisitRate = totalVisits > 0 ? roundHalfUp(totalAmount / totalVisits) : 0;
      const visitVat = calculateVatDetails(perVisitRate, 0.05, false);

      const customer = await Customer.findById(prev.customerId).session(session);
      const propertyAddress = customer?.address || "Dubai, UAE";
      const customerPhone = customer?.phone || "";

      for (let i = 0; i < visitDates.length; i++) {
        const serviceNumber = await generateServiceNumber(session);
        const scheduledService = new Service({
          serviceNumber,
          customerId: prev.customerId,
          contractId: newContract._id,
          customerName: prev.customerName,
          customerPhone,
          propertyAddress,
          serviceType: newContract.serviceType,
          propertyType: newContract.propertyType,
          quantity: 1,
          rate: perVisitRate,
          discount: 0,
          subtotal: visitVat.subtotal,
          vatAmount: visitVat.vatAmount,
          totalAmount: visitVat.total,
          paidAmount: 0,
          balanceAmount: visitVat.total,
          paymentStatus: "UNPAID",
          paymentMethod: "Cash",
          scheduledDate: visitDates[i],
          status: "UPCOMING",
          technicianNotes: `Renewed Contract Visit #${i + 1} (${newContract.contractNumber})`
        });
        await scheduledService.save({ session });
      }

      await recalculateCustomerFinancials(prev.customerId, session);
      return newContract;
    });
  },

  updateContractStatus: async (id, status) => {
    const contract = await Contract.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { status } },
      { new: true }
    );
    if (!contract) {
      throw new AppError("Contract not found", 404);
    }
    return contract;
  },

  updateContract: async (id, contractData) => {
    const existing = await Contract.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      throw new AppError("Contract not found", 404);
    }

    const updates = { ...contractData };
    if (contractData.endDate && new Date(contractData.endDate).getTime() !== new Date(existing.endDate).getTime()) {
      updates.renewalReminderSentAt = null;
    }

    const contract = await Contract.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );
    return contract;
  }
};
