import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Phone, MessageSquare, Edit, Trash2, Building2, User, ChevronDown } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { ConfirmationModal } from "../../components/common/ConfirmationModal";
import { formatCurrency } from "../../utils/formatters";

export const CustomerList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customers", search, filter],
    queryFn: () => customerApi.getCustomers({ search, filter })
  });

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    try {
      await customerApi.deleteCustomer(customerToDelete.id);
      addToast("Customer deleted successfully", "success");
      setCustomerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customersSelect"] });
    } catch (err) {
      addToast(err.message || "Failed to delete customer", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Customers Directory"
        description="Manage residential & commercial pest control clients across Dubai & UAE"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/customers/new")}>
            Add Customer
          </Button>
        }
      />

      {/* Standardized Search & Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search customers, phone, company, TRN..."
        selectFilter={
          <div className="relative w-full">
            <label htmlFor="customer-type-filter" className="sr-only">
              Filter by customer type or status
            </label>
            <select
              id="customer-type-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3.5 pr-9 py-2 h-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="monthly">Type: Commercial</option>
              <option value="yearly">Type: Yearly</option>
              <option value="residential">Type: Residential</option>
              <option value="expiring">Status: Expiring Soon</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.customers?.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Get started by adding your first residential or commercial customer."
          actionLabel="Add Customer"
          onAction={() => navigate("/customers/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.customers.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs shrink-0">
                      {c.customerType === "Commercial" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <Link to={`/customers/${c.id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 transition">
                        {c.name}
                      </Link>
                      {c.company && <p className="text-[11px] text-slate-500 font-medium">{c.company}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {c.customerType}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </p>
                  {c.trn && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      TRN: <span className="font-bold text-slate-700">{c.trn}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 truncate">{c.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">Total Revenue</span>
                    <p className="text-xs font-bold text-slate-900">{formatCurrency(c.totalRevenue)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">Outstanding</span>
                    <p className={`text-xs font-bold ${c.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatCurrency(c.outstandingBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <a
                  href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  aria-label="WhatsApp"
                  className="w-9 h-9 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition border border-emerald-200/60 shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
                <Link
                  to={`/customers/${c.id}/edit`}
                  title="Edit Customer"
                  aria-label="Edit Customer"
                  className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200/60 shadow-2xs"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(c)}
                  title="Delete Customer"
                  aria-label="Delete Customer"
                  className="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition border border-rose-200/60 shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Frontend Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!customerToDelete}
        onClose={() => {
          if (!deleteLoading) setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={
          <div>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-900">
                "{customerToDelete?.name}"
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
