import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Banknote, FileCheck, FileText, BellOff } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { notificationApi } from "../../services/notificationApi";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { formatDate } from "../../utils/formatters";

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 60000,
    staleTime: 30000
  });

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationApi.markAsRead(id);
      refetch();
      if (link) navigate(link);
    } catch {
      addToast("Failed to update notification", "error");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "service":
        return <MdOutlineCleaningServices className="w-5 h-5" />;
      case "payment":
        return <Banknote className="w-5 h-5" />;
      case "invoice":
        return <FileText className="w-5 h-5" />;
      case "contract":
      default:
        return <FileCheck className="w-5 h-5" />;
    }
  };

  const getNotificationBadgeClass = (type) => {
    switch (type) {
      case "service":
        return "bg-blue-100 text-blue-600";
      case "payment":
        return "bg-emerald-100 text-emerald-600";
      case "invoice":
        return "bg-rose-100 text-rose-600";
      case "contract":
      default:
        return "bg-amber-100 text-amber-600";
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Notifications & Alerts"
        description="Reminders for upcoming service appointments, contract renewals & payment dues"
      />

      {isLoading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.notifications?.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-3xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BellOff className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-500 mt-1">You are all caught up on operational alerts and reminders.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden max-w-3xl mx-auto">
          {data?.notifications?.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id, n.link)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer transition ${
                !n.read ? "bg-blue-50/40 hover:bg-blue-50/70 font-semibold" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${getNotificationBadgeClass(n.type)}`}>
                  {getNotificationIcon(n.type)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
                </div>
              </div>

              {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
