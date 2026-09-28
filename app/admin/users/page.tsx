"use client";
import { useState, useEffect } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState([
    { id: "1", name: "Rajat Sharma", role: "COMMANDER", email: "commander@ndma.gov.in", districts: ["ALL"], mfa_active: true, suspended: false },
    { id: "2", name: "Anil Kumar", role: "DISTRICT_OFFICER", email: "anil@ndma.gov.in", districts: ["Wayanad", "Kozhikode"], mfa_active: false, suspended: false },
    { id: "3", name: "Priya Singh", role: "DISPATCHER", email: "priya@ndma.gov.in", districts: ["Mumbai", "Thane"], mfa_active: true, suspended: true }
  ]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto text-primary">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">User Management & Access Control</h1>
          <p className="text-muted text-sm">Manage staff roles, district scoping, and two-factor authentication.</p>
        </div>
        <button className="btn btn-primary bg-blue-600 text-white px-4 py-2 rounded-lg">
          + Invite Staff Member
        </button>
      </div>

      <div className="bg-[#0d1322] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/20 text-muted">
            <tr>
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Role & Scope</th>
              <th className="p-4 font-semibold">Security (2FA)</th>
              <th className="p-4 font-semibold">Status</th>


              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-white">{u.name}</div>
                  <div className="text-muted text-xs">{u.email}</div>
                </td>
                <td className="p-4">
                  <select className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-xs mb-1 block w-full max-w-[150px]">
                    <option value="COMMANDER" selected={u.role === "COMMANDER"}>Commander</option>
                    <option value="DISTRICT_OFFICER" selected={u.role === "DISTRICT_OFFICER"}>District Officer</option>
                    <option value="DISPATCHER" selected={u.role === "DISPATCHER"}>Dispatcher</option>
                    <option value="FIELD_RESPONDER" selected={u.role === "FIELD_RESPONDER"}>Field Responder</option>
                    <option value="ANALYST" selected={u.role === "ANALYST"}>Analyst</option>
                  </select>
                  <div className="text-muted text-xs">Scope: {u.districts.join(", ")}</div>
                </td>
                <td className="p-4">
                  {u.mfa_active ? (
                    <span className="text-success text-xs font-semibold flex items-center gap-1">✅ Active</span>
                  ) : (
                    <span className="text-critical text-xs font-semibold flex items-center gap-1">⚠️ Missing 2FA</span>
                  )}
                  {u.mfa_active && (
                    <button className="text-[10px] text-info underline mt-1 block">Reset 2FA</button>
                  )}
                </td>
                <td className="p-4">
                  {u.suspended ? (
                    <span className="text-critical text-xs font-semibold px-2 py-1 bg-red-900/30 rounded border border-red-500/30">Suspended</span>
                  ) : (
                    <span className="text-success text-xs font-semibold px-2 py-1 bg-green-900/30 rounded border border-green-500/30">Active</span>
                  )}
                </td>
                <td className="p-4 text-right flex flex-col gap-1 items-end">
                  <button className="text-xs text-muted hover:text-white underline">Sign out everywhere</button>
                  <button className="text-xs text-critical hover:text-red-400 underline">{u.suspended ? "Restore Account" : "Suspend Account"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
