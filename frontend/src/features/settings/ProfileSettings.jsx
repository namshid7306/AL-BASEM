import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Mail, Shield, Phone } from "lucide-react";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";

export const ProfileSettings = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageHeader
        title="Admin User Profile"
        description="Manage your account profile and authentication preferences"
      />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-xl font-black shadow-md">
            {user?.avatar || "AB"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name || "Admin User"}</h3>
            <p className="text-xs text-slate-500 font-semibold">{user?.email || ""}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
              Role: {user?.role || "Administrator"}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> Account Email
            </span>
            <span className="font-bold text-slate-900">{user?.email || ""}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> Phone Contact
            </span>
            <span className="font-bold text-slate-900">{user?.phone || "+971 50 123 4567"}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" /> Authentication Token
            </span>
            <span className="font-mono text-emerald-600 font-bold">JWT Active (Bearer)</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
