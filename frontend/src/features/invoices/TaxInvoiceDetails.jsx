import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Banknote } from "lucide-react";
import { invoiceApi } from "../../services/invoiceApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { formatDate } from "../../utils/formatters";
import { RecordPaymentModal } from "../payments/RecordPaymentModal";

export const TaxInvoiceDetails = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceApi.getInvoiceById(invoiceId)
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError || !data?.invoice) {
    return (
      <PageContainer>
        <ErrorState message="Tax Invoice details could not be loaded." onRetry={refetch} />
      </PageContainer>
    );
  }

  const { invoice, companySettings } = data;

  const sellerName = companySettings?.companyName || "AL BASEM PUBLIC HEALTH PESTS CONTROL SERVICES L.L.C";
  const sellerCity = companySettings?.location || "Dubai";
  const sellerCountry = companySettings?.country || "United Arab Emirates";
  const sellerPhone = companySettings?.phone || "0566337123";
  const sellerEmail = companySettings?.email || "albasemofficial@gmail.com";
  const sellerWebsite = companySettings?.website || "www.albasemservices.com";
  const sellerTrn = companySettings?.trn || "105363200400003";
  const logoUrl = companySettings?.logoUrl || "/al-basem-logo.png";
  const defaultNotes = companySettings?.defaultNotes || "Thanks for your business.";

  const formatNum = (val) => (Number(val) || 0).toFixed(2);

  return (
    <PageContainer>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description="Official UAE VAT tax invoice layout"
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/invoices")}>
              Back
            </Button>
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print Invoice
            </Button>
            {invoice.balanceAmount > 0 && (
              <Button variant="primary" icon={Banknote} onClick={() => setIsRecordPaymentOpen(true)}>
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      {/* Official AL BASEM Reference Invoice Document */}
      <div className="overflow-x-auto pb-6">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-md max-w-4xl mx-auto space-y-8 font-sans text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none min-w-[700px]">
          {/* Top Section */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-8">
            {/* Left: Logo + Seller Company Info */}
            <div className="space-y-3 max-w-md">
              <img
                src={logoUrl}
                alt={sellerName}
                className="h-16 w-auto object-contain"
              />
              <div className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
                <p className="font-bold text-slate-900 text-sm leading-tight mb-1">{sellerName}</p>
                <p>{sellerCity}</p>
                <p>{sellerCountry}</p>
                <p>{sellerPhone}</p>
                <p>{sellerEmail}</p>
                <p>{sellerWebsite}</p>
                <p className="font-semibold text-slate-800 pt-0.5">TRN {sellerTrn}</p>
              </div>
            </div>

            {/* Right: TAX INVOICE Header + Invoice# + Balance Due Callout */}
            <div className="text-right space-y-3">
              <div>
                <h1 className="text-3xl font-light tracking-wide text-slate-900 uppercase">TAX INVOICE</h1>
                <p className="text-sm font-semibold text-slate-700 mt-1">Invoice# {invoice.invoiceNumber}</p>
              </div>

              <div className="pt-2">
                <span className="text-xs text-slate-500 font-medium block">Balance Due</span>
                <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
                  AED{formatNum(invoice.balanceAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer (Bill To) & Invoice Metadata Section */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-2">
            {/* Left: Bill To */}
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold block mb-1">Bill To</span>
              <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
              {invoice.customerTrn ? (
                <p className="font-medium text-slate-700">TRN {invoice.customerTrn}</p>
              ) : null}
              {invoice.customerAddress && (
                <p className="text-slate-600 font-normal pt-0.5">{invoice.customerAddress}</p>
              )}
            </div>

            {/* Right: Dates & Terms */}
            <div className="space-y-1.5 text-right font-medium">
              <div className="flex justify-end gap-4">
                <span className="text-slate-500">Invoice Date :</span>
                <span className="text-slate-900 font-semibold w-24 text-right">{formatDate(invoice.invoiceDate, "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-slate-500">Terms :</span>
                <span className="text-slate-900 font-semibold w-24 text-right">{invoice.paymentTerms || "Due on Receipt"}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-slate-500">Due Date :</span>
                <span className="text-slate-900 font-semibold w-24 text-right">{formatDate(invoice.dueDate, "dd MMM yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table - Reference Dark Header Design */}
          <div className="pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-[11px] font-semibold">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Item & Description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Tax %</th>
                  <th className="py-2.5 px-3 text-right">Tax</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-normal">
                {invoice.lineItems?.map((item, idx) => {
                  const qty = Number(item.quantity) || 1;
                  const rate = Number(item.rate) || 0;
                  const lineAmount = qty * rate - (item.discount || 0);
                  const taxRate = item.taxRate !== undefined ? item.taxRate : 5.0;
                  const taxVal = item.taxAmount !== undefined ? item.taxAmount : lineAmount * (taxRate / 100);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-3 px-3 text-right">{formatNum(qty)}</td>
                      <td className="py-3 px-3 text-right">{formatNum(rate)}</td>
                      <td className="py-3 px-3 text-right">{formatNum(taxRate)}</td>
                      <td className="py-3 px-3 text-right">{formatNum(taxVal)}</td>
                      <td className="py-3 px-3 text-right font-semibold">{formatNum(lineAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Summary - Right Aligned Matching Reference */}
          <div className="flex justify-end pt-4">
            <div className="w-80 text-xs space-y-2 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Sub Total</span>
                <span className="text-slate-900 font-semibold">{formatNum(invoice.subtotal)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Vat5% (5%)</span>
                <span className="text-slate-900 font-semibold">{formatNum(invoice.vatAmount)}</span>
              </div>

              <div className="flex justify-between py-1.5 font-bold text-sm text-slate-900">
                <span>Total</span>
                <span>AED{formatNum(invoice.totalAmount)}</span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="flex justify-between py-1 text-rose-600 font-semibold">
                  <span>Payment Made</span>
                  <span>(-) {formatNum(invoice.paidAmount)}</span>
                </div>
              )}

              {/* Highlighted Balance Due Container */}
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl mt-2 font-extrabold text-sm text-slate-900">
                <span>Balance Due</span>
                <span>AED{formatNum(invoice.balanceAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section - Bottom Left */}
          <div className="pt-8 border-t border-slate-100 space-y-1 text-xs text-slate-600">
            <span className="font-bold text-slate-900 block">Notes</span>
            <p className="font-normal">{invoice.notes || defaultNotes}</p>
          </div>
        </div>
      </div>

      <RecordPaymentModal isOpen={isRecordPaymentOpen} onClose={() => setIsRecordPaymentOpen(false)} />
    </PageContainer>
  );
};
