import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Edit,
  Trash2,
  FileCheck,
  Receipt,
  FileText,
  User,
  PlusCircle
} from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { customerApi } from "../../services/customerApi";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ConfirmationModal } from "../../components/common/ConfirmationModal";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customerApi.getCustomerById(customerId)
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError || !data?.customer) {
    return (
      <PageContainer>
        <ErrorState message="Customer profile could not be loaded." onRetry={refetch} />
      </PageContainer>
    );
  }

  const { customer, services = [], contracts = [], invoices = [], payments = [] } = data;

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await customerApi.deleteCustomer(customer.id);
      addToast("Customer deleted successfully", "success");
      setIsDeleteModalOpen(false);
      navigate("/customers");
    } catch (err) {
      addToast(err.message || "Failed to delete customer", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={customer.name}
        description={`${customer.customerType} Client • ${customer.address}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              aria-label="WhatsApp"
              className="w-10 h-10 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition border border-emerald-200/60 shadow-2xs"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
              title="Edit Customer"
              aria-label="Edit Customer"
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200/60 shadow-2xs cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              title="Delete Customer"
              aria-label="Delete Customer"
              className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition border border-rose-200/60 shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Lifetime Revenue</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(customer.totalRevenue)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
          <p className={`text-2xl font-extrabold mt-1 ${customer.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {formatCurrency(customer.outstandingBalance)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Completed Services</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{services.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Active Contracts</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{contracts.filter(c => c.status === "ACTIVE").length}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: "overview", label: "Overview", icon: User },
          { id: "services", label: `Services (${services.length})`, icon: MdOutlineCleaningServices },
          { id: "contracts", label: `Contracts (${contracts.length})`, icon: FileCheck },
          { id: "payments", label: `Payments (${payments.length})`, icon: Receipt },
          { id: "invoices", label: `Invoices (${invoices.length})`, icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Client Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Customer Name</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Phone Number</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.phone}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Email Address</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.email || "Not provided"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Customer Type</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.customerType}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 font-medium">Property Address</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.address}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "services" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Service History</h3>
            <Link to={`/services/new?customerId=${customer.id}`}>
              <Button variant="primary" size="sm" icon={PlusCircle}>
                New Service Job
              </Button>
            </Link>
          </div>
          {services.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No service jobs logged for this customer yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {services.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <Link to={`/services/${s.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                      {s.serviceNumber} - {s.serviceType}
                    </Link>
                    <p className="text-[11px] text-slate-500">{formatDate(s.scheduledDate)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={s.status} size="sm" />
                    <p className="font-bold text-slate-900 mt-1">{formatCurrency(s.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Pest Control Contracts</h3>
          {contracts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No contracts active for this customer.</p>
          ) : (
            <div className="space-y-3">
              {contracts.map((cnt) => (
                <div key={cnt.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{cnt.contractNumber} - {cnt.planName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(cnt.startDate)} to {formatDate(cnt.endDate)} • {cnt.serviceFrequency} visit frequency
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={cnt.status} size="sm" />
                    <p className="font-extrabold text-sm text-slate-900 mt-1">{formatCurrency(cnt.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Payment Receipts</h3>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No payments logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{p.paymentNumber} ({p.paymentMethod})</p>
                    <p className="text-[11px] text-slate-500">{formatDate(p.paymentDate)} • Inv: {p.invoiceNumber}</p>
                  </div>
                  <span className="font-extrabold text-emerald-600">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Tax Invoices</h3>
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No tax invoices generated for this client.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link to={`/invoices/${inv.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                      {inv.invoiceNumber}
                    </Link>
                    <p className="text-[11px] text-slate-500">Date: {formatDate(inv.invoiceDate)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={inv.status} size="sm" />
                    <p className="font-bold text-slate-900 mt-1">{formatCurrency(inv.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frontend Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteLoading) setIsDeleteModalOpen(false);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={
          <div>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-900">
                "{customer?.name}"
              </span>
              ?
            </p>
            <p className="text-slate-400 text-xs mt-1.5">
              This action cannot be undone.
            </p>
          </div>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </PageContainer>
  );
};
