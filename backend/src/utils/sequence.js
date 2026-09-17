import { Sequence } from "../models/Sequence.js";
import { CompanySettings } from "../models/CompanySettings.js";

export const getNextSequenceNumber = async (sequenceName, defaultStart = 1000, session = null) => {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;

  const sequence = await Sequence.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { value: 1 } },
    options
  );

  // If newly created and value is 1, adjust to defaultStart if greater
  if (sequence.value === 1 && defaultStart > 1) {
    sequence.value = defaultStart;
    await sequence.save({ session });
  }

  return sequence.value;
};

export const generateInvoiceNumber = async (session = null) => {
  const settings = await CompanySettings.findOne().session(session);
  const prefix = settings?.invoicePrefix || "INV-";
  const startNum = settings?.nextInvoiceNum || 1050;

  const num = await getNextSequenceNumber("invoiceNumber", startNum, session);
  return `${prefix}${num}`;
};

export const generateQuoteNumber = async (session = null) => {
  const settings = await CompanySettings.findOne().session(session);
  const prefix = settings?.quotePrefix || "QT-";
  const startNum = settings?.nextQuoteNum || 205;

  const num = await getNextSequenceNumber("quoteNumber", startNum, session);
  return `${prefix}${num}`;
};

export const generateServiceNumber = async (session = null) => {
  const num = await getNextSequenceNumber("serviceNumber", 1049, session);
  return `SVC-${num}`;
};

export const generatePaymentNumber = async (session = null) => {
  const num = await getNextSequenceNumber("paymentNumber", 1049, session);
  return `PAY-${num}`;
};

export const generateContractNumber = async (session = null) => {
  const year = new Date().getFullYear();
  const num = await getNextSequenceNumber(`contractNumber_${year}`, 1, session);
  const padded = String(num).padStart(2, "0");
  return `CNT-${year}-${padded}`;
};
