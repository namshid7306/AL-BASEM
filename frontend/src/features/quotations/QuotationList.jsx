import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ChevronDown } from "lucide-react";
import { quotationApi } from "../../services/quotationApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const QuotationList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotations", search, status],
    queryFn: () => quotationApi.getQuotations({ search, status })
  });

  return (
    <PageContainer>
      <PageHeader
        title="Pest Control Quotations"
        description="Issue professional price quotes, soil treatment proposals, and convert accepted quotes to invoices"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/quotations/new")}>
            Create Quote
          </Button>
        }
      />

      {/* Standardized Search & Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search quote #, customer, subject..."
        selectFilter={
          <div className="relative w-full">
            <label htmlFor="quote-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="quote-status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3.5 pr-9 py-2 h-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="draft">Status: Draft</option>
              <option value="sent">Status: Sent</option>
              <option value="accepted">Status: Accepted</option>
              <option value="rejected">Status: Rejected</option>
              <option value="expired">Status: Expired</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.quotations?.length === 0 ? (
        <EmptyState
          title="No quotations found"
          description="Create your first price proposal for residential or commercial clients."
          actionLabel="Create Quote"
          onAction={() => navigate("/quotations/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.quotations.map((q) => (
            <div key={q.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{q.quoteNumber}</span>
                    <h3 className="font-extrabold text-sm text-slate-900">{q.subject}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">Client: {q.customerName}</p>
                  </div>
                  <StatusBadge status={q.status} size="sm" />
                </div>

                <div className="space-y-1 text-xs py-3">
                  <p className="text-slate-500">Date Issued: <span className="font-semibold text-slate-800">{formatDate(q.date)}</span></p>
                  <p className="text-slate-500">Valid Until: <span className="font-semibold text-slate-800">{formatDate(q.validUntil)}</span></p>
                  <p className="text-slate-500">Line Items: <span className="font-semibold text-slate-800">{q.lineItems?.length || 1} item(s)</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-base font-extrabold text-slate-900">{formatCurrency(q.grandTotal)}</span>
                <Link to={`/quotations/${q.id}`}>
                  <Button variant="outline" size="sm">
                    View Quotation
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
