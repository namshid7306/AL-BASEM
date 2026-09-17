import React from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { OperationalCard } from "./OperationalCard";

export const OperationalOverview = ({ data }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <OperationalCard
        title="Services Today"
        value={data?.servicesToday || 0}
        icon={MdOutlineCleaningServices}
        iconBgColor="bg-slate-100 text-slate-700"
      />
      <OperationalCard
        title="Completed"
        value={data?.completedServices || 0}
        icon={CheckCircle}
        iconBgColor="bg-emerald-50 text-emerald-600"
      />
      <OperationalCard
        title="Upcoming"
        value={data?.upcomingServices || 0}
        icon={Clock}
        iconBgColor="bg-blue-50 text-blue-600"
      />
      <OperationalCard
        title="Active Contracts"
        value={data?.activeContracts || 0}
        icon={FileText}
        iconBgColor="bg-slate-100 text-slate-700"
      />
    </div>
  );
};
