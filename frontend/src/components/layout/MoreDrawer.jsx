import React from "react";
import { NavLink } from "react-router-dom";
import {
  FileCheck2,
  CalendarDays,
  CreditCard,
  FileText,
  ReceiptText,
  BarChart3,
  Bell,
  Settings,
  User,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const MoreDrawer = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  if (!isOpen) return null;

  const moreItems = [
    { label: "Contracts", path: "/contracts", icon: FileCheck2 },
    { label: "Calendar", path: "/calendar", icon: CalendarDays },
    { label: "Payments", path: "/payments", icon: CreditCard },
    { label: "Quotations", path: "/quotations", icon: FileText },
    { label: "Tax Invoices", path: "/invoices", icon: ReceiptText },
    { label: "Reports & VAT", path: "/reports", icon: BarChart3 },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Company Settings", path: "/settings", icon: Settings },
    { label: "Profile", path: "/profile", icon: User }
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in">
      <div className="bg-white rounded-t-3xl p-5 border-t border-slate-200 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.avatar || "AB"}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{user?.name || "Admin"}</h4>
              <p className="text-[11px] text-slate-500">{user?.email || ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                    isActive
                      ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                      : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-1.5 shrink-0" />
                <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 mt-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
