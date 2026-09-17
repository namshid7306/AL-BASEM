import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Save } from "lucide-react";
import { settingsApi } from "../../services/settingsApi";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";

export const CompanySettings = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    companyName: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    trn: "",
    invoicePrefix: "INV-2026-",
    nextInvoiceNum: 104,
    quotePrefix: "QT-2026-",
    nextQuoteNum: 205,
    paymentTerms: "Net 15 Days",
    defaultNotes: ""
  });
  const [loading, setLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.getSettings()
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsApi.updateSettings(formData);
      addToast("Company settings updated successfully!", "success");
      refetch();
    } catch (err) {
      addToast(err.message || "Failed to update settings", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Company & Billing Settings"
        description="Configure AL BASEM company TRN, tax invoice numbering prefix, and default terms"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-4 border-b border-slate-100 pb-5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" /> Business Profile & TRN
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registered Business Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                UAE TRN (Tax Registration Number) *
              </label>
              <input
                type="text"
                name="trn"
                value={formData.trn}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Physical Office Address / Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        {/* Invoice & Quotation Numbering Rules */}
        <div className="space-y-4 border-b border-slate-100 pb-5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Document Numbering Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax Invoice Prefix
              </label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Tax Invoice Number
              </label>
              <input
                type="number"
                name="nextInvoiceNum"
                value={formData.nextInvoiceNum}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quotation Prefix
              </label>
              <input
                type="text"
                name="quotePrefix"
                value={formData.quotePrefix}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Quotation Number
              </label>
              <input
                type="number"
                name="nextQuoteNum"
                value={formData.nextQuoteNum}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Default Tax Invoice Terms & Conditions
            </label>
            <textarea
              rows={3}
              name="defaultNotes"
              value={formData.defaultNotes}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="primary" icon={Save} loading={loading}>
            Save Business Settings
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
