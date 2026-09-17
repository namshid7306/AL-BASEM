import { CompanySettings } from "../models/CompanySettings.js";
import { Sequence } from "../models/Sequence.js";

export const settingsService = {
  getSettings: async () => {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }
    return settings;
  },

  updateSettings: async (data) => {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings(data);
    } else {
      Object.assign(settings, data);
    }
    await settings.save();

    // Synchronize sequence if numbers updated
    if (data.nextInvoiceNum) {
      await Sequence.findOneAndUpdate(
        { name: "invoiceNumber" },
        { $set: { value: data.nextInvoiceNum - 1 } },
        { upsert: true }
      );
    }
    if (data.nextQuoteNum) {
      await Sequence.findOneAndUpdate(
        { name: "quoteNumber" },
        { $set: { value: data.nextQuoteNum - 1 } },
        { upsert: true }
      );
    }

    return settings;
  }
};
