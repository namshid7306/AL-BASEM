import React from "react";

export const PageContainer = ({ children, className = "" }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0 ${className}`}>
      {children}
    </div>
  );
};
