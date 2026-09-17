import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Receipt, UserPlus, FileText, FilePlus } from "lucide-react";
import { Button } from "../../components/common/Button";

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <h3 className="font-bold text-slate-900 text-base mb-4">Quick Business Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => navigate("/services/new")}
          className="w-full justify-start py-3"
        >
          Add New Service
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={Receipt}
          onClick={() => navigate("/expenses/new")}
          className="w-full justify-start py-3 text-slate-700"
        >
          Log Expense
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={UserPlus}
          onClick={() => navigate("/customers/new")}
          className="w-full justify-start py-3 text-slate-700"
        >
          Add Customer
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={FileText}
          onClick={() => navigate("/quotations/new")}
          className="w-full justify-start py-3 text-slate-700"
        >
          Create Quotation
        </Button>

        <Button
          variant="secondary"
          size="md"
          icon={FilePlus}
          onClick={() => navigate("/invoices/new")}
          className="w-full justify-start py-3"
        >
          Create Tax Invoice
        </Button>
      </div>
    </div>
  );
};
