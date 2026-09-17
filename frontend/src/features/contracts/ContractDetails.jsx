import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileCheck, RefreshCw, XCircle, Calendar } from "lucide-react";
import { contractApi } from "../../services/contractApi";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const ContractDetails = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewalAmount, setRenewalAmount] = useState(4500);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => contractApi.getContractById(contractId)
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isError || !data?.contract) {
    return (
      <PageContainer>
        <ErrorState message="Contract profile could not be loaded." onRetry={refetch} />
      </PageContainer>
    );
  }

  const { contract, services = [] } = data;

  const handleRenew = async () => {
    try {
      const renewed = await contractApi.renewContract(contract.id, {
        totalAmount: renewalAmount
      });
      addToast(`Contract renewed successfully as ${renewed.contractNumber}! Historical data preserved.`, "success");
      setIsRenewModalOpen(false);
      navigate("/contracts");
    } catch (err) {
      addToast(err.message || "Failed to renew contract", "error");
    }
  };

  const handleCancelContract = async () => {
    if (window.confirm(`Are you sure you want to cancel contract ${contract.contractNumber}?`)) {
      try {
        await contractApi.updateContractStatus(contract.id, "CANCELLED");
        addToast("Contract cancelled", "warning");
        refetch();
      } catch (err) {
        addToast(err.message || "Failed to update contract status", "error");
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${contract.contractNumber}: ${contract.planName}`}
        description={`Client: ${contract.customerName} • Version v${contract.historicalVersion || 1}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/contracts")}>
              Back
            </Button>
            <Button variant="primary" icon={RefreshCw} onClick={() => setIsRenewModalOpen(true)}>
              Renew Contract
            </Button>

            {contract.status === "ACTIVE" && (
              <Button variant="danger" icon={XCircle} onClick={handleCancelContract}>
                Cancel Agreement
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{contract.planName}</h3>
                  <p className="text-xs text-slate-500">Service Scope: {contract.serviceType}</p>
                </div>
              </div>
              <StatusBadge status={contract.status} size="md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Customer</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{contract.customerName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Agreement Term</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Service Visit Frequency</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                  {contract.serviceFrequency.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment Billing Schedule</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                  {contract.paymentFrequency.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {contract.notes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-1">Contract Notes & Scope</h4>
                <p className="text-xs text-slate-600">{contract.notes}</p>
              </div>
            )}
          </div>

          {/* Generated Scheduled Visits */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Scheduled Contract Service Visits
            </h3>
            {services.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No visits generated yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {services.map((s, idx) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">
                        Visit #{idx + 1}: {s.serviceType}
                      </span>
                      <p className="text-[11px] text-slate-500">{formatDate(s.scheduledDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} size="sm" />
                      <Link to={`/services/${s.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-3">
              Agreement Financials
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Contract Total Value</span>
                <span className="text-base font-extrabold text-white">{formatCurrency(contract.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Visits Planned</span>
                <span className="font-bold text-white">{contract.totalVisits} visits</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Completed Visits</span>
                <span className="font-bold text-emerald-400">{contract.completedVisits} visits</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Notice: Renewing or modifying this contract creates a new version while keeping all past visits, invoices, and payment history intact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Renew Contract Modal */}
      <Modal isOpen={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Pest Control Contract">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Renewing <strong>{contract.contractNumber}</strong> will create a new active contract version (v{(contract.historicalVersion || 1) + 1}). All historical services and invoices remain intact.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Annual Contract Amount (AED)</label>
            <input
              type="number"
              value={renewalAmount}
              onChange={(e) => setRenewalAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRenew}>
              Confirm Renewal
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
