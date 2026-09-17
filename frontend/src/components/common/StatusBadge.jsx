import React from "react";

export const StatusBadge = ({ status, size = "md", className = "" }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (["PAID", "COMPLETED", "ACCEPTED", "ACTIVE"].includes(normalized)) {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  } else if (["PENDING", "UNPAID", "UPCOMING", "SENT"].includes(normalized)) {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200/80";
  } else if (["PARTIAL", "RESCHEDULED"].includes(normalized)) {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200/80";
  } else if (["OVERDUE", "CANCELLED", "REJECTED", "EXPIRED", "DELETED"].includes(normalized)) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200/80";
  } else if (["DRAFT"].includes(normalized)) {
    colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border tracking-wide uppercase ${colorClasses} ${sizeClasses[size]} ${className}`}
    >
      {status}
    </span>
  );
};
