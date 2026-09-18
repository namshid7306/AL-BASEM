import React from "react";
import { Outlet } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans print:bg-white print:min-h-0">
      {/* Fixed Left Sidebar on Desktop */}
      <DesktopSidebar />

      {/* Main Content Area - offset by lg:ml-64 */}
      <div className="lg:ml-64 min-h-screen flex flex-col min-w-0 pb-20 lg:pb-8 print:ml-0 print:m-0 print:p-0 print:min-h-0 print:block">
        <Header />
        <main className="flex-1 print:p-0 print:m-0 print:block">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
