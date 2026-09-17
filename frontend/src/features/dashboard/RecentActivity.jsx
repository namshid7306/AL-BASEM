import React from "react";
import { Link } from "react-router-dom";
import { Banknote, Receipt, ArrowUpRight } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { formatCurrency } from "../../utils/formatters";
import { StatusBadge } from "../../components/common/StatusBadge";

export const RecentActivity = ({ activities = [] }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Recent Business Activity</h3>
          <p className="text-xs text-slate-500">Live feed of service jobs, payments, and expenses</p>
        </div>
        <Link to="/services" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((item) => (
          <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  item.type === "service"
                    ? "bg-blue-50 text-blue-600"
                    : item.type === "payment"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-500"
                }`}
              >
                {item.type === "service" ? (
                  <MdOutlineCleaningServices className="w-5 h-5" />
                ) : item.type === "payment" ? (
                  <Banknote className="w-5 h-5" />
                ) : (
                  <Receipt className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <StatusBadge status={item.status} size="sm" />
              <p className="text-xs font-bold text-slate-900 mt-1">{formatCurrency(item.amount)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
