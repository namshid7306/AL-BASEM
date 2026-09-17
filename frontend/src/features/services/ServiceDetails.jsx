import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { serviceApi } from "../../services/serviceApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const ServiceDetails = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => serviceApi.getServiceById(serviceId)
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError || !data?.service) {
    return (
      <PageContainer>
        <ErrorState message="Service job details could not be loaded." onRetry={refetch} />
      </PageContainer>
    );
  }

  const { service, invoice, payments = [] } = data;

  return (
    <PageContainer>
      <PageHeader
        title={`${service.serviceNumber}: ${service.serviceType}`}
        description={`Scheduled on ${formatDate(service.scheduledDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/services")}>
              Back to Services
            </Button>
            {invoice && (
              <Link to={`/invoices/${invoice.id}`}>
                <Button variant="secondary" icon={FileText}>
                  View Tax Invoice
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <MdOutlineCleaningServices className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{service.serviceType}</h3>
                  <p className="text-xs text-slate-500">Property: {service.propertyType}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={service.status} size="md" />
                <StatusBadge status={service.paymentStatus} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Customer Name</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{service.customerName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Contact Phone</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{service.customerPhone}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Location Address</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{service.propertyAddress}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Scheduled Treatment Date</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{formatDate(service.scheduledDate)}</p>
              </div>
            </div>

            {service.technicianNotes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-1">Technician Notes</h4>
                <p className="text-xs text-slate-600">{service.technicianNotes}</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Payment Log
            </h3>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No payments collected yet for this service.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{p.paymentNumber} ({p.paymentMethod})</p>
                      <p className="text-[11px] text-slate-500">{formatDate(p.paymentDate)}</p>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Sidebar */}
        <div>
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-3">
              Financial Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(service.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>UAE VAT 5%</span>
                <span>{formatCurrency(service.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-2">
                <span>Total Charge</span>
                <span>{formatCurrency(service.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 pt-1">
                <span>Paid Amount</span>
                <span>{formatCurrency(service.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-400 pt-1">
                <span>Outstanding Balance</span>
                <span>{formatCurrency(service.balanceAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
