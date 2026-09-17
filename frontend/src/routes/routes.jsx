import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";

import Dashboard from "../features/dashboard/Dashboard";
import { CustomerList } from "../features/customers/CustomerList";
import { CustomerForm } from "../features/customers/CustomerForm";
import { CustomerDetails } from "../features/customers/CustomerDetails";

import { ServiceList } from "../features/services/ServiceList";
import { ServiceForm } from "../features/services/ServiceForm";
import { ServiceDetails } from "../features/services/ServiceDetails";

import { ContractList } from "../features/contracts/ContractList";
import { ContractForm } from "../features/contracts/ContractForm";
import { ContractDetails } from "../features/contracts/ContractDetails";

import { CalendarView } from "../features/calendar/CalendarView";

import { ExpenseList } from "../features/expenses/ExpenseList";
import { ExpenseForm } from "../features/expenses/ExpenseForm";

import { PaymentList } from "../features/payments/PaymentList";

import { QuotationList } from "../features/quotations/QuotationList";
import { QuotationForm } from "../features/quotations/QuotationForm";
import { QuotationDetails } from "../features/quotations/QuotationDetails";

import { TaxInvoiceList } from "../features/invoices/TaxInvoiceList";
import { InvoiceForm } from "../features/invoices/InvoiceForm";
import { TaxInvoiceDetails } from "../features/invoices/TaxInvoiceDetails";

import { ReportsDashboard } from "../features/reports/ReportsDashboard";
import { NotificationCenter } from "../features/notifications/NotificationCenter";
import { CompanySettings } from "../features/settings/CompanySettings";
import { ProfileSettings } from "../features/settings/ProfileSettings";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />

        {/* Customers */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:customerId" element={<CustomerDetails />} />
        <Route path="customers/:customerId/edit" element={<CustomerForm />} />

        {/* Services */}
        <Route path="services" element={<ServiceList />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:serviceId" element={<ServiceDetails />} />

        {/* Contracts */}
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/new" element={<ContractForm />} />
        <Route path="contracts/:contractId" element={<ContractDetails />} />

        {/* Calendar */}
        <Route path="calendar" element={<CalendarView />} />

        {/* Expenses */}
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="expenses/new" element={<ExpenseForm />} />

        {/* Payments */}
        <Route path="payments" element={<PaymentList />} />

        {/* Quotations */}
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new" element={<QuotationForm />} />
        <Route path="quotations/:quotationId" element={<QuotationDetails />} />

        {/* Invoices */}
        <Route path="invoices" element={<TaxInvoiceList />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="invoices/:invoiceId" element={<TaxInvoiceDetails />} />

        {/* Reports & VAT */}
        <Route path="reports" element={<ReportsDashboard />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationCenter />} />

        {/* Settings & Profile */}
        <Route path="settings" element={<CompanySettings />} />
        <Route path="profile" element={<ProfileSettings />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
