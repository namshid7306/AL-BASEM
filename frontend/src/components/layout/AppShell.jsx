import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileNavDrawer } from "./MobileNavDrawer";

export const AppShell = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Fixed Left Sidebar on Desktop */}
      <DesktopSidebar />

      {/* Main Content Area - offset by lg:ml-64 */}
      <div className="lg:ml-64 min-h-screen flex flex-col min-w-0 pb-20 lg:pb-8">
        <Header
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          isMobileNavOpen={isMobileNavOpen}
        />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </div>
  );
};
