import React from "react";
import { Calendar } from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { useAuth } from "../../context/AuthContext";

export const DashboardHeader = () => {
  const { user } = useAuth();
  const todayFormatted = formatDate(new Date(), "EEEE, dd MMM yyyy");

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Welcome back, {user?.name || "Admin"}
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard Overview
        </h2>
      </div>
      <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs w-fit">
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span>Today: {todayFormatted}</span>
      </div>
    </div>
  );
};
