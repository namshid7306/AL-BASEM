import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, WalletCards, Menu } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { MoreDrawer } from "./MoreDrawer";

export const MobileBottomNav = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-30 shadow-lg">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </NavLink>

        <NavLink
          to="/services"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
            }`
          }
        >
          <MdOutlineCleaningServices className="w-5 h-5" />
          <span className="text-[10px]">Services</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Customers</span>
        </NavLink>

        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
            }`
          }
        >
          <WalletCards className="w-5 h-5" />
          <span className="text-[10px]">Expenses</span>
        </NavLink>

        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 text-slate-500 hover:text-slate-900 font-medium rounded-xl transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      <MoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
};
