import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, MapPin, Calendar, ChevronDown } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { serviceApi } from "../../services/serviceApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const ServiceList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["services", search, status],
    queryFn: () => serviceApi.getServices({ search, status })
  });

  return (
    <PageContainer>
      <PageHeader
        title="Services & Treatments"
        description="Schedule, track and record pest control treatments across properties"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/services/new")}>
            Add Service
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-[650px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service #, client, treatment type..."
              className="w-full pl-10 pr-4 py-2 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Single Status Dropdown Filter */}
          <div className="relative w-full sm:w-44 shrink-0">
            <label htmlFor="service-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="service-status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3.5 pr-9 py-2 h-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="upcoming">Status: Upcoming</option>
              <option value="completed">Status: Completed</option>
              <option value="rescheduled">Status: Rescheduled</option>
              <option value="cancelled">Status: Cancelled</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.services?.length === 0 ? (
        <EmptyState
          title="No services found"
          description="Create your first pest control service job."
          actionLabel="Add Service"
          onAction={() => navigate("/services/new")}
        />
      ) : (
        <div className="space-y-3">
          {data?.services.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0 mt-0.5">
                  <MdOutlineCleaningServices className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/services/${s.id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600">
                      {s.serviceNumber} - {s.serviceType}
                    </Link>
                    <StatusBadge status={s.status} size="sm" />
                    <StatusBadge status={s.paymentStatus} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Client: {s.customerName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.propertyAddress}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Scheduled Date: {formatDate(s.scheduledDate)}</span>
                  </p>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 gap-2">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Amount</span>
                  <span className="text-base font-extrabold text-slate-900">{formatCurrency(s.totalAmount)}</span>
                </div>
                <Link to={`/services/${s.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
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
