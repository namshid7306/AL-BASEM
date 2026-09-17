import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "../../services/invoiceApi";
import { paymentApi } from "../../services/paymentApi";
import { useToast } from "../../context/ToastContext";
import { PAYMENT_METHODS } from "../../constants";
import { formatCurrency } from "../../utils/formatters";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";

export const RecordPaymentModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: invoiceData } = useQuery({
    queryKey: ["invoicesUnpaid"],
    queryFn: () => invoiceApi.getInvoices({ status: "all" })
  });

  const unpaidInvoices = invoiceData?.invoices?.filter(i => (i.balanceAmount || 0) > 0) || [];
  const selectedInvoice = unpaidInvoices.find(i => i.id === invoiceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceId) {
      addToast("Please select an invoice to record payment", "error");
      return;
    }
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      addToast("Please enter a valid payment amount", "error");
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = "pay_" + (invoiceId || "inv") + "_" + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now());
      await paymentApi.recordPayment(
        {
          invoiceId,
          amount: payNum,
          paymentMethod,
          referenceNumber,
          notes,
          paymentDate: new Date().toISOString()
        },
        idempotencyKey
      );

      addToast("Payment recorded successfully!", "success");
      // Invalidate relevant query caches for business workflows
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      onClose();
    } catch (err) {
      addToast(err.message || "Failed to record payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Client Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Select Pending Tax Invoice *
          </label>
          <select
            value={invoiceId}
            onChange={(e) => {
              const val = e.target.value;
              setInvoiceId(val);
              const inv = unpaidInvoices.find(i => i.id === val);
              if (inv) setAmount(inv.balanceAmount);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="">-- Select Pending Invoice --</option>
            {unpaidInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} - {inv.customerName} (Bal: {formatCurrency(inv.balanceAmount)})
              </option>
            ))}
          </select>
        </div>

        {selectedInvoice && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-900">Invoice Total: {formatCurrency(selectedInvoice.totalAmount)}</p>
            <p className="text-emerald-700 font-semibold">Paid so far: {formatCurrency(selectedInvoice.paidAmount)}</p>
            <p className="text-rose-700 font-bold">Remaining Balance: {formatCurrency(selectedInvoice.balanceAmount)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (AED) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.id} value={pm.name}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Transaction Reference / Cheque #
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. TXN-998877 or Cheque #00124"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional collection notes..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
