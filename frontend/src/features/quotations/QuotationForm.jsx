import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, User, FileText, Calculator } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { quotationApi } from "../../services/quotationApi";
import { useToast } from "../../context/ToastContext";
import { calculateLineItemsTotal, formatCurrency } from "../../utils/formatters";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";

export const QuotationForm = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("Pest Control & Sanitization Quotation");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("Quote valid for 30 days. Free inspection included.");
  const [loading, setLoading] = useState(false);

  const [lineItems, setLineItems] = useState([
    { id: 1, description: "General Pest Control Treatment", quantity: 1, rate: 450, discount: 0 }
  ]);

  const { data: customersData } = useQuery({
    queryKey: ["customersSelectQuote"],
    queryFn: () => customerApi.getCustomers()
  });

  const totals = calculateLineItemsTotal(lineItems, 0.05, false);

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), description: "Additional Service Item", quantity: 1, rate: 200, discount: 0 }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      addToast("Please select a customer for this quotation", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId,
        subject,
        date,
        validUntil,
        lineItems,
        notes
      };

      const result = await quotationApi.createQuotation(payload);
      addToast(`Quotation ${result.quoteNumber} created successfully!`, "success");
      navigate("/quotations");
    } catch (err) {
      addToast(err.message || "Failed to create quotation", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create New Quotation"
        description="Draft custom pest control price proposals with dynamic line items & 5% UAE VAT"
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/quotations")}>
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-600" /> Header Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
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
                Quotation Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quotation Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Line Items Editor */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Line Items Editor
            </h3>
            <Button variant="outline" size="sm" icon={Plus} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase sm:hidden mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    placeholder="Description of treatment..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase sm:hidden mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase sm:hidden mb-1">Rate (AED)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.rate}
                    onChange={(e) => handleItemChange(item.id, "rate", Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-900 block text-right">
                    {formatCurrency((item.quantity * item.rate) - (item.discount || 0))}
                  </span>
                </div>

                <div className="sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" /> Financial Totals
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>UAE VAT (5%)</span>
              <span>{formatCurrency(totals.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-800 pt-2">
              <span>Grand Total</span>
              <span className="text-blue-400">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Default Terms / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Save Quotation Proposal
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
