import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileCheck, User, Calendar, Calculator } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { contractApi } from "../../services/contractApi";
import { useToast } from "../../context/ToastContext";
import { SERVICE_TYPES, PROPERTY_TYPES, SERVICE_FREQUENCIES, PAYMENT_FREQUENCIES } from "../../constants";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";

export const ContractForm = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [planName, setPlanName] = useState("Annual Commercial Protection");
  const [serviceType, setServiceType] = useState("General Pest Control");
  const [propertyType, setPropertyType] = useState("Villa");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [serviceFrequency, setServiceFrequency] = useState("monthly");
  const [paymentFrequency, setPaymentFrequency] = useState("quarterly");
  const [totalVisits, setTotalVisits] = useState(12);
  const [totalAmount, setTotalAmount] = useState(3600);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: customersData } = useQuery({
    queryKey: ["customersSelectContract"],
    queryFn: () => customerApi.getCustomers()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      addToast("Please select a customer for the contract", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId,
        planName,
        serviceType,
        propertyType,
        startDate,
        endDate,
        serviceFrequency,
        paymentFrequency,
        totalVisits,
        totalAmount,
        notes
      };

      const result = await contractApi.createContract(payload);
      addToast(`Contract ${result.contractNumber} created with visit schedule!`, "success");
      navigate("/contracts");
    } catch (err) {
      addToast(err.message || "Failed to create contract", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Pest Control Agreement"
        description="Set up recurring visit schedules, separate payment terms, and generate service entries"
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/contracts")}>
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-3xl mx-auto space-y-6">
        <div className="space-y-4 border-b border-slate-100 pb-5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> Customer & Agreement Title
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Customer --</option>
                {customersData?.customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Plan Name / Subject *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Annual Commercial Villa Package"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-100 pb-5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" /> Treatment & Property Scope
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {SERVICE_TYPES.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.id} value={pt.name}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-100 pb-5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Schedule & Frequency Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Visit Frequency *
              </label>
              <select
                value={serviceFrequency}
                onChange={(e) => setServiceFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {SERVICE_FREQUENCIES.map((sf) => (
                  <option key={sf.id} value={sf.id}>
                    {sf.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Frequency *
              </label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {PAYMENT_FREQUENCIES.map((pf) => (
                  <option key={pf.id} value={pf.id}>
                    {pf.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Visits Count
              </label>
              <input
                type="number"
                min={1}
                value={totalVisits}
                onChange={(e) => setTotalVisits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" /> Value & Terms
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Contract Amount (AED)
              </label>
              <input
                type="number"
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Special Terms / Warranty Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Free emergency call-outs within 24h"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={() => navigate("/contracts")}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save & Generate Schedule
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
