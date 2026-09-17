import {
  LayoutDashboard,
  Users,
  FileCheck2,
  CalendarDays,
  WalletCards,
  CreditCard,
  FileText,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";
import { MdOutlineCleaningServices } from "react-icons/md";

export const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Services", path: "/services", icon: MdOutlineCleaningServices },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Contracts", path: "/contracts", icon: FileCheck2 },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Expenses", path: "/expenses", icon: WalletCards },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Quotations", path: "/quotations", icon: FileText },
  { label: "Invoices", path: "/invoices", icon: LiaFileInvoiceDollarSolid },
  { label: "Reports & VAT", path: "/reports", icon: BarChart3 },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Settings", path: "/settings", icon: Settings },
];
