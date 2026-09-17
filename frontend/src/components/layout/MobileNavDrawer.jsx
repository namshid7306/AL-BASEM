import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { X, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { navItems } from "../../constants/navigation";

export const MobileNavDrawer = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-[280px] max-w-[80vw] h-full bg-slate-900 text-slate-300 shadow-2xl flex flex-col z-50 select-none border-r border-slate-800 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="h-16 shrink-0 px-4 flex items-center justify-between border-b border-slate-800/80">
          <span className="text-sm font-bold text-white tracking-wide uppercase">
            Menu Navigation
          </span>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
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

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 mt-auto shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                {user?.avatar || "AB"}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
