import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export const ErrorState = ({
  title = "Something went wrong",
  message = "Failed to load data from server. Please try again.",
  onRetry
}) => {
  return (
    <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-8 text-center flex flex-col items-center justify-center my-4">
      <div className="p-3 bg-rose-100 text-rose-600 rounded-xl mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-rose-900 mb-1">{title}</h4>
      <p className="text-xs text-rose-700 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};
