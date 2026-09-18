import React from "react";

export const PageHeader = ({ title, description, actions, children, className = "" }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      {children}
    </div>
  );
};
