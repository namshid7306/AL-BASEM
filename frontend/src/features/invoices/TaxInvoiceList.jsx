import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ChevronDown } from "lucide-react";
import { invoiceApi } from "../../services/invoiceApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const TaxInvoiceList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices", search, status],
    queryFn: () => invoiceApi.getInvoices({ search, status })
  });

  return (
    <PageContainer>
      <PageHeader
        title="UAE Tax Invoices"
        description="Official FTA 5% VAT tax invoices, billing statements, and payment tracking"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/invoices/new")}>
            Create Tax Invoice
          </Button>
        }
      />

      {/* Standardized Search & Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search invoice #, customer, TRN..."
        selectFilter={
          <div className="relative w-full">
            <label htmlFor="invoice-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="invoice-status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3.5 pr-9 py-2 h-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="paid">Status: Paid</option>
              <option value="partial">Status: Partial</option>
              <option value="unpaid">Status: Unpaid</option>
              <option value="overdue">Status: Overdue</option>
              <option value="cancelled">Status: Cancelled</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.invoices?.length === 0 ? (
        <EmptyState
          title="No tax invoices found"
          description="Create your first official UAE Tax Invoice."
          actionLabel="Create Tax Invoice"
          onAction={() => navigate("/invoices/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.invoices.map((inv) => (
            <div key={inv.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{inv.invoiceNumber}</span>
                    <h3 className="font-extrabold text-sm text-slate-900">{inv.customerName}</h3>
                    {inv.customerTrn && <p className="text-[11px] font-mono text-slate-500">TRN: {inv.customerTrn}</p>}
                  </div>
                  <StatusBadge status={inv.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal</span>
                    <p className="font-bold text-slate-800">{formatCurrency(inv.subtotal)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">VAT (5%)</span>
                    <p className="font-bold text-slate-800">{formatCurrency(inv.vatAmount)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount</span>
                    <p className="font-extrabold text-slate-900">{formatCurrency(inv.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Balance Due</span>
                    <p className={`font-bold ${inv.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatCurrency(inv.balanceAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Date: {formatDate(inv.invoiceDate)}</span>
                <Link to={`/invoices/${inv.id}`}>
                  <Button variant="outline" size="sm">
                    View Tax Invoice
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
