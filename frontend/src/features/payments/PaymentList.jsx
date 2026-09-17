import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Banknote } from "lucide-react";
import { paymentApi } from "../../services/paymentApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { PAYMENT_METHODS } from "../../constants";
import { RecordPaymentModal } from "./RecordPaymentModal";

export const PaymentList = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["payments", search, status, dateFilter, paymentMethod],
    queryFn: () => paymentApi.getPayments({ search, status, date: dateFilter, paymentMethod })
  });

  const activeFilterCount =
    (status !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (paymentMethod !== "all" ? 1 : 0);

  return (
    <PageContainer>
      <PageHeader
        title="Payment Transactions"
        description="Track customer payments, cash receipts, bank transfers and outstanding balances"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setIsRecordModalOpen(true)}>
            Record Payment
          </Button>
        }
      />

      {/* Standardized Search & Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search payment #, invoice #, client, reference..."
        filterCount={activeFilterCount}
        onClearFilters={() => {
          setStatus("all");
          setDateFilter("all");
          setPaymentMethod("all");
        }}
      >
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Date Period
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="VOIDED">Voided</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.id} value={pm.name}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>
      </SearchFilterBar>

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.payments?.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="Record client payments received for tax invoices."
          actionLabel="Record Payment"
          onAction={() => setIsRecordModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data?.payments.map((p) => (
              <div key={p.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{p.paymentNumber}</h4>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      {p.customerName} • Inv #{p.invoiceNumber}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Paid via <span className="font-bold text-slate-700">{p.paymentMethod}</span> ({p.referenceNumber}) • {formatDate(p.paymentDate)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600">+{formatCurrency(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RecordPaymentModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />
    </PageContainer>
  );
};
