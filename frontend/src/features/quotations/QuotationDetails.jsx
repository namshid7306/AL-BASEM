import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";
import { quotationApi } from "../../services/quotationApi";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/formatters";

export const QuotationDetails = () => {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => quotationApi.getQuotationById(quotationId)
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError || !data?.quotation) {
    return (
      <PageContainer>
        <ErrorState message="Quotation proposal could not be loaded." onRetry={refetch} />
      </PageContainer>
    );
  }

  const { quotation } = data;
  const formatNum = (val) => (Number(val) || 0).toFixed(2);

  const handleConvertToInvoice = async () => {
    try {
      const res = await quotationApi.convertToInvoice(quotation.id);
      addToast(`Quotation accepted & converted to Tax Invoice ${res.invoice.invoiceNumber}!`, "success");
      navigate(`/invoices/${res.invoice.id}`);
    } catch (err) {
      addToast(err.message || "Failed to convert quotation to invoice", "error");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Quotation ${quotation.quoteNumber}`}
        description={`Subject: ${quotation.subject}`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/quotations")}>
              Back
            </Button>
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print Quote
            </Button>
            {quotation.status !== "ACCEPTED" && (
              <Button variant="primary" icon={CheckCircle2} onClick={handleConvertToInvoice}>
                Convert to Tax Invoice
              </Button>
            )}
          </div>
        }
      />

      {/* Printable Quote Sheet matching official branding */}
      <div className="overflow-x-auto pb-6">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-md max-w-4xl mx-auto space-y-8 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 min-w-[700px]">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <img
                src="/al-basem-logo.png"
                alt="AL BASEM PUBLIC HEALTH PESTS CONTROL SERVICES L.L.C"
                className="h-14 w-auto object-contain"
              />
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-900">AL BASEM PUBLIC HEALTH PESTS CONTROL SERVICES L.L.C</p>
                <p>Dubai, United Arab Emirates • 0566337123</p>
                <p>TRN 105363200400003</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <h1 className="text-3xl font-light text-slate-900 uppercase tracking-wide">QUOTATION</h1>
              <p className="text-sm font-semibold text-blue-600 font-mono">{quotation.quoteNumber}</p>
              <StatusBadge status={quotation.status} size="md" />
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
            <div>
              <span className="text-slate-500 font-semibold block mb-1">Prepared For</span>
              <p className="font-bold text-slate-900 text-sm">{quotation.customerName}</p>
              <p className="text-slate-600">{quotation.customerPhone}</p>
              <p className="text-slate-600">{quotation.customerEmail}</p>
              <p className="text-slate-600 mt-1">{quotation.address}</p>
            </div>
            <div className="space-y-1 text-right font-medium">
              <p><strong className="text-slate-700">Quote Date:</strong> {formatDate(quotation.date)}</p>
              <p><strong className="text-slate-700">Valid Until:</strong> {formatDate(quotation.validUntil)}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-semibold">
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
                {quotation.lineItems?.map((item, idx) => {
                  const qty = Number(item.quantity) || 1;
                  const rate = Number(item.rate) || 0;
                  const lineAmount = qty * rate - (item.discount || 0);
                  const taxVal = lineAmount * 0.05;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-3 px-3 text-right">{formatNum(qty)}</td>
                      <td className="py-3 px-3 text-right">{formatNum(rate)}</td>
                      <td className="py-3 px-3 text-right">5.00</td>
                      <td className="py-3 px-3 text-right">{formatNum(taxVal)}</td>
                      <td className="py-3 px-3 text-right font-semibold">{formatNum(lineAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4">
            <div className="w-80 text-xs space-y-2 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Sub Total</span>
                <span className="text-slate-900 font-semibold">{formatNum(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Vat5% (5%)</span>
                <span className="text-slate-900 font-semibold">{formatNum(quotation.vatAmount)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl mt-2 font-extrabold text-sm text-slate-900">
                <span>Total Quote Amount</span>
                <span>AED{formatNum(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className="pt-6 border-t border-slate-100 space-y-1 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Terms & Special Conditions</span>
              <p>{quotation.notes}</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
