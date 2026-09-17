import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const RevenueExpenseChart = ({ chartData }) => {
  const [period, setPeriod] = useState("week");

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Revenue vs Expenses</h3>
          <p className="text-xs text-slate-500">Financial comparison across operational dates (AED)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPeriod("today")}
              className={`px-2.5 py-1 rounded-lg transition ${
                period === "today" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-2.5 py-1 rounded-lg transition ${
                period === "week" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-2.5 py-1 rounded-lg transition ${
                period === "month" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Month
            </button>
          </div>
          <Link to="/reports" className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-2">
            Full Report →
          </Link>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
              formatter={(value) => [`AED ${value}`, ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
            <Bar dataKey="revenue" name="Revenue (AED)" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={14} />
            <Bar dataKey="expense" name="Expenses (AED)" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
