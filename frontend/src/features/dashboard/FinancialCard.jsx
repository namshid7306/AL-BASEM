import React from "react";
import { formatAmountOnly } from "../../utils/formatters";

export const FinancialCard = ({ title, value, currency = "AED", icon: Icon, isHighlighted = false, iconBgColor }) => {
  if (isHighlighted) {
    return (
      <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-lg border border-slate-800 flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xs font-bold text-indigo-300">{currency}</span>
            <span className="text-2xl font-extrabold text-white tracking-tight">{formatAmountOnly(value)}</span>
          </div>
        </div>
        {Icon && (
          <div className="p-2.5 bg-white/10 text-indigo-300 rounded-xl backdrop-blur-sm shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
      <div>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-xs font-bold text-slate-400">{currency}</span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatAmountOnly(value)}</span>
        </div>
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBgColor || "bg-slate-100 text-slate-600"}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
