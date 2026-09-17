import React from "react";

export const StatCard = ({
  title,
  value,
  currency = "AED",
  icon: Icon,
  variant = "default", // default, highlighted, success, danger, warning
  subtitle
}) => {
  if (variant === "highlighted") {
    return (
      <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-lg border border-slate-800 flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            {currency && <span className="text-xs font-semibold text-indigo-300">{currency}</span>}
            <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{value}</span>
          </div>
          {subtitle && <p className="text-[11px] text-indigo-200 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-3 bg-white/10 text-indigo-300 rounded-xl backdrop-blur-sm shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    );
  }

  const iconBg = {
    default: "bg-blue-50 text-blue-600",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-rose-50 text-rose-600",
    warning: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <div className="flex items-baseline gap-1 mt-2">
          {currency && <span className="text-xs font-semibold text-slate-400">{currency}</span>}
          <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg[variant] || iconBg.default}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
