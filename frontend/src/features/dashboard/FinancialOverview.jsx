import React from "react";
import { Banknote, Receipt, TrendingUp, ClipboardList } from "lucide-react";
import { FinancialCard } from "./FinancialCard";

export const FinancialOverview = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FinancialCard
        title="Today's Revenue"
        value={data?.todayRevenue || 0}
        icon={Banknote}
        iconBgColor="bg-blue-50 text-blue-600"
      />
      <FinancialCard
        title="Today's Expenses"
        value={data?.todayExpenses || 0}
        icon={Receipt}
        iconBgColor="bg-rose-50 text-rose-500"
      />
      <FinancialCard
        title="Net Profit"
        value={data?.netProfit || 0}
        icon={TrendingUp}
        isHighlighted={true}
      />
      <FinancialCard
        title="Pending Payments"
        value={data?.pendingPayments || 0}
        icon={ClipboardList}
        iconBgColor="bg-amber-50 text-amber-600"
      />
    </div>
  );
};
