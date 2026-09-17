import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ChevronDown } from "lucide-react";
import { contractApi } from "../../services/contractApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const ContractList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["contracts", search, status],
    queryFn: () => contractApi.getContracts({ search, status })
  });

  return (
    <PageContainer>
      <PageHeader
        title="Annual Pest Control Contracts"
        description="Manage recurring commercial & residential villa agreements with automated visit schedules"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/contracts/new")}>
            Create Contract
          </Button>
        }
      />

      {/* Standardized Search & Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search contracts, customer, plan, service type..."
        selectFilter={
          <div className="relative w-full">
            <label htmlFor="contract-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="contract-status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3.5 pr-9 py-2 h-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="expiring">Status: Expiring Soon</option>
              <option value="expired">Status: Expired</option>
              <option value="renewed">Status: Renewed</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.contracts?.length === 0 ? (
        <EmptyState
          title="No contracts found"
          description="Create your first recurring annual or custom pest control contract."
          actionLabel="Create Contract"
          onAction={() => navigate("/contracts/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.contracts.map((cnt) => (
            <div key={cnt.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{cnt.contractNumber}</span>
                    <h3 className="font-extrabold text-sm text-slate-900">{cnt.planName}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">Client: {cnt.customerName}</p>
                  </div>
                  <StatusBadge status={cnt.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Frequency</span>
                    <p className="font-bold text-slate-800 capitalize">{cnt.serviceFrequency.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Schedule</span>
                    <p className="font-bold text-slate-800 capitalize">{cnt.paymentFrequency.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Visits Progress</span>
                    <p className="font-bold text-slate-800">{cnt.completedVisits} / {cnt.totalVisits} completed</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Contract Amount</span>
                    <p className="font-extrabold text-slate-900">{formatCurrency(cnt.totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {formatDate(cnt.startDate)} → {formatDate(cnt.endDate)}
                </span>
                <Link to={`/contracts/${cnt.id}`}>
                  <Button variant="outline" size="sm">
                    Manage Contract
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
