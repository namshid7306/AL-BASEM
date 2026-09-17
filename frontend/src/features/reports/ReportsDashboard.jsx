import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, TrendingUp, Banknote, Receipt, Calculator } from "lucide-react";
import { reportApi } from "../../services/reportApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { formatCurrency } from "../../utils/formatters";

export const ReportsDashboard = () => {
  const [activeReportTab, setActiveReportTab] = useState("pnl"); // pnl, vat, services

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportApi.getReports()
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  const { financials, serviceTypeBreakdown = [] } = data || {};

  return (
    <PageContainer>
      <PageHeader
        title="Business Intelligence & VAT Reports"
        description="Financial statements, profit & loss, service analytics, and official UAE 5% VAT returns"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Taxable Revenue" value={formatCurrency(financials?.totalSales || 0)} icon={Banknote} variant="default" />
        <StatCard title="Total Operational Expenses" value={formatCurrency(financials?.totalExpenses || 0)} icon={Receipt} variant="danger" />
        <StatCard title="Net Profit" value={formatCurrency(financials?.netProfit || 0)} icon={TrendingUp} variant="highlighted" />
        <StatCard title="Net VAT Payable (5%)" value={formatCurrency(financials?.netVatPayable || 0)} icon={Calculator} variant="warning" />
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: "pnl", label: "Profit & Loss Statement", icon: TrendingUp },
          { id: "vat", label: "UAE 5% VAT Return", icon: Calculator },
          { id: "services", label: "Service Type Analytics", icon: PieChart }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                activeReportTab === tab.id
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: PnL Statement */}
      {activeReportTab === "pnl" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Profit & Loss Summary</h3>

          <div className="space-y-4 max-w-2xl text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-700">Gross Sales Revenue (Excl. VAT)</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(financials?.totalSales)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
              <span className="font-bold">Total Operating Expenses</span>
              <span className="font-extrabold">-{formatCurrency(financials?.totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
              <span>NET OPERATING PROFIT</span>
              <span className="text-emerald-600">{formatCurrency(financials?.netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: UAE VAT Return */}
      {activeReportTab === "vat" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">UAE Federal Tax Authority (FTA) 5% VAT Return</h3>
            <p className="text-xs text-slate-500 mt-0.5">Summary of taxable sales, output VAT collected, and recoverable input VAT</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                  <th className="py-3 px-3">VAT Box Description</th>
                  <th className="py-3 px-3 text-right">Taxable Amount (AED)</th>
                  <th className="py-3 px-3 text-right">VAT Amount (5%) (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                <tr>
                  <td className="py-3.5 px-3">Standard Rated Supplies (Sales Revenue)</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(financials?.totalSales)}</td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 font-bold">{formatCurrency(financials?.vatCollected)}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3">Standard Rated Expenses (Input VAT Recoverable)</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(financials?.totalExpenses)}</td>
                  <td className="py-3.5 px-3 text-right text-rose-600 font-bold">-{formatCurrency(financials?.inputVatRecoverable)}</td>
                </tr>
                <tr className="bg-slate-900 text-white font-extrabold text-sm">
                  <td className="py-4 px-3">NET VAT PAYABLE TO FTA</td>
                  <td className="py-4 px-3 text-right">-</td>
                  <td className="py-4 px-3 text-right text-blue-400">{formatCurrency(financials?.netVatPayable)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Service Type Analytics */}
      {activeReportTab === "services" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Treatment Revenue Breakdown</h3>
          <div className="space-y-3">
            {serviceTypeBreakdown.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                  <p className="text-[11px] text-slate-500">{item.count} service jobs completed</p>
                </div>
                <span className="font-extrabold text-sm text-slate-900">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
