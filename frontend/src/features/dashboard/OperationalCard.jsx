import React from "react";

export const OperationalCard = ({ title, value, icon: Icon, iconBgColor = "bg-slate-100 text-slate-600" }) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-2xs">
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBgColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{title}</p>
      </div>
    </div>
  );
};
