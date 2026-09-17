import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../services/dashboardApi";
import { PageContainer } from "../../components/common/PageContainer";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";

import { DashboardHeader } from "./DashboardHeader";
import { FinancialOverview } from "./FinancialOverview";
import { OperationalOverview } from "./OperationalOverview";
import { RevenueExpenseChart } from "./RevenueExpenseChart";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: () => dashboardApi.getDashboardData("month")
  });

  if (isLoading) {
    return (
      <PageContainer>
        <DashboardHeader />
        <LoadingSkeleton count={4} type="card" />
        <LoadingSkeleton count={1} type="table" />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <DashboardHeader />
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardHeader />

      {/* Financial KPI Summary Cards */}
      <FinancialOverview data={data?.financials} />

      {/* Operational Metrics */}
      <OperationalOverview data={data?.operations} />

      {/* Chart & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueExpenseChart chartData={data?.chartData} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Business Activity Stream */}
      <RecentActivity activities={data?.recentActivity} />
    </PageContainer>
  );
}
