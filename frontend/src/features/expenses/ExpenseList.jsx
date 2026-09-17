import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Banknote, Receipt, Calendar } from "lucide-react";
import { expenseApi } from "../../services/expenseApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { StatCard } from "../../components/common/StatCard";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../constants";

export const ExpenseList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses", search, category, dateFilter, paymentMethod],
    queryFn: () => expenseApi.getExpenses({ search, category, date: dateFilter, paymentMethod })
  });

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (paymentMethod !== "all" ? 1 : 0);

  return (
    <PageContainer>
      <PageHeader
        title="Expense Logs"
        description="Track operational expenses, technician allowances, fuel, chemicals & office overheads"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/expenses/new")}>
            Log Expense
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Logged Expenses" value={formatCurrency(data?.totalExpenses || 0)} icon={Receipt} variant="danger" />
        <StatCard title="Total Receipts" value={data?.expenses?.length || 0} icon={Banknote} variant="default" />
        <StatCard title="Active Categories" value={EXPENSE_CATEGORIES.length} icon={Calendar} variant="default" />
      </div>

      {/* Standardized Search & Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search description, notes, category..."
        filterCount={activeFilterCount}
        onClearFilters={() => {
          setCategory("all");
          setDateFilter("all");
          setPaymentMethod("all");
        }}
      >
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

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
      ) : data?.expenses?.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Log operational costs such as petrol, chemical supplies, or maintenance."
          actionLabel="Log Expense"
          onAction={() => navigate("/expenses/new")}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data?.expenses.map((exp) => (
              <div key={exp.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{exp.description}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Category: <span className="text-slate-700 font-bold">{exp.categoryName}</span> • Paid via {exp.paymentMethod}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(exp.date)}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-rose-600">-{formatCurrency(exp.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
