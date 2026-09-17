import React from "react";

export const LoadingSkeleton = ({ count = 3, type = "card" }) => {
  if (type === "table") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-md w-1/4"></div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
          <div className="h-8 bg-slate-200 rounded-md w-2/3"></div>
          <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
        </div>
      ))}
    </div>
  );
};
