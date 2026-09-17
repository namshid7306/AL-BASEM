import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export const EmptyState = ({
  title = "No data found",
  description = "There are no records matching your request.",
  icon: Icon = FolderOpen,
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center my-4">
      <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
