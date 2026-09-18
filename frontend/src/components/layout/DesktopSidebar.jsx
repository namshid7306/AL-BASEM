import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import alBasemLogo from "../../assets/Al_basem_logo-removebg-preview.png";
import { navItems } from "../../constants/navigation";

export const DesktopSidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 select-none print:hidden">
      {/* Brand Header — Compact Horizontal Branding Row */}
      <div className="h-16 shrink-0 flex items-center px-4 border-b border-slate-800/80">
        <NavLink
          to="/"
          className="flex items-center gap-3 min-w-0 group"
        >
          {/* Logo Mark Container (38px x 38px) */}
          <div className="w-[38px] h-[38px] rounded-xl bg-white flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden">
            <img
              src={alBasemLogo}
              alt="AL BASEM"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Business Name & Descriptor */}
          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-sm font-bold tracking-tight text-white leading-tight truncate group-hover:text-blue-400 transition-colors">
              AL BASEM
            </span>
            <span className="text-[11px] font-medium text-slate-400 tracking-normal leading-tight truncate mt-0.5">
              Pest Control Services
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links Area */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-[12px] px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `p-4 border-t border-slate-800/80 mt-auto shrink-0 flex items-center justify-between transition-colors cursor-pointer group ${
            isActive
              ? "bg-slate-800/80"
              : "bg-slate-950/60 hover:bg-slate-800/50"
          }`
        }
        aria-label="Admin Profile"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
            {user?.avatar || "AB"}
          </div>
          <div className="truncate min-w-0">
            <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </NavLink>
    </aside>
  );
};
