import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Receipt, DollarSign } from "lucide-react";
import { expenseApi } from "../../services/expenseApi";
import { useToast } from "../../context/ToastContext";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../constants";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(3, "Description is required"),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional()
});

export const ExpenseForm = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "petrol",
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "Cash",
      notes: ""
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await expenseApi.createExpense(data);
      addToast("Expense logged successfully!", "success");
      navigate("/expenses");
    } catch (err) {
      addToast(err.message || "Failed to log expense", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Log Operational Expense"
        description="Record business expenses (fuel, chemical supplies, parking, vehicle upkeep)"
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/expenses")}>
            Cancel
          </Button>
        }
      />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Expense Category *
            </label>
            <select
              {...register("category")}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <div className="relative">
              <Receipt className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...register("description")}
                placeholder="e.g. ENOC Petrol Van 3, Bayer Maxforce gel purchase..."
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.description && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount (AED) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.amount && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.date && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              {...register("paymentMethod")}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.id} value={pm.name}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Receipt Details
            </label>
            <textarea
              rows={2}
              {...register("notes")}
              placeholder="Vendor invoice number, voucher notes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => navigate("/expenses")}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Save Expense Log
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};
