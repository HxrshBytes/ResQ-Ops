"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserRole } from "@/lib/auth";

export function UserAuthBadge() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(false);

  const fetchSession = () => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
    window.location.href = "/login";
  };

  const handleSwitchRole = async (role: UserRole) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      fetchSession();
      setOpenDropdown(false);
      window.location.reload();
    }
  };

  if (loading) {
    return <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Checking Security Clearance...</span>;
  }

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: 99,
          padding: "4px 10px",
          fontSize: "0.72rem",
          color: "#10b981",
          fontWeight: 600,
        }}>
          🔒 Citizen Privacy Active (No Account Required)
        </div>
        <Link href="/login" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>
          🔑 Agency Staff Login
        </Link>
      </div>
    );
  }

  const roleColor =
    user.role === "COMMANDER"
      ? "var(--critical)"
      : user.role === "RESPONDER"
      ? "var(--high)"
      : user.role === "SECURITY_AUDITOR"
      ? "var(--info)"
      : "var(--teal-bright)";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpenDropdown(!openDropdown)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(12, 22, 40, 0.75)",
          border: `1px solid ${roleColor}60`,
          borderRadius: 99,
          padding: "4px 12px 4px 6px",
          color: "#fff",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: `${roleColor}30`,
          border: `1px solid ${roleColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem",
        }}>
          {user.avatar || "🛡️"}
        </span>

        <div style={{ textAlign: "left", lineHeight: 1.2 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{user.name.split(" ")[0]}</div>
          <div style={{ fontSize: "0.62rem", color: roleColor, fontWeight: 700 }}>{user.role}</div>
        </div>

        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>▼</span>
      </button>

      {openDropdown && (
        <div style={{
          position: "absolute",
          top: "120%",
          right: 0,
          width: 260,
          background: "rgba(8, 14, 26, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2 }}>{user.agency}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
              Badge: {user.badgeId}
            </div>
            <div style={{ fontSize: "0.62rem", color: roleColor, fontWeight: 700, marginTop: 4 }}>
              {user.clearanceLevel}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Switch Role Clearance
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button
              onClick={() => handleSwitchRole("COMMANDER")}
              style={{ padding: "6px 8px", background: "transparent", border: "none", color: "var(--critical)", fontSize: "0.75rem", textAlign: "left", cursor: "pointer", borderRadius: 4, fontWeight: 600 }}
            >
              🛡️ NDMA Commander
            </button>
            <button
              onClick={() => handleSwitchRole("RESPONDER")}
              style={{ padding: "6px 8px", background: "transparent", border: "none", color: "var(--high)", fontSize: "0.75rem", textAlign: "left", cursor: "pointer", borderRadius: 4, fontWeight: 600 }}
            >
              🚨 NDRF Tactical Responder
            </button>
            <button
              onClick={() => handleSwitchRole("SECURITY_AUDITOR")}
              style={{ padding: "6px 8px", background: "transparent", border: "none", color: "var(--info)", fontSize: "0.75rem", textAlign: "left", cursor: "pointer", borderRadius: 4, fontWeight: 600 }}
            >
              🔒 CERT-In Security Auditor
            </button>
            <button
              onClick={() => handleSwitchRole("CITIZEN")}
              style={{ padding: "6px 8px", background: "transparent", border: "none", color: "var(--teal-bright)", fontSize: "0.75rem", textAlign: "left", cursor: "pointer", borderRadius: 4, fontWeight: 600 }}
            >
              📱 Public Citizen
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

          <Link href="/security" style={{ fontSize: "0.75rem", color: "var(--info)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            ⚙️ Security SOC & Audit Log
          </Link>

          <button
            onClick={handleLogout}
            style={{
              padding: "8px",
              background: "rgba(255,43,74,0.15)",
              border: "1px solid rgba(255,43,74,0.3)",
              color: "#ff8090",
              borderRadius: 6,
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🚪 Terminate Session (Logout)
          </button>
        </div>
      )}
    </div>
  );
}

export default UserAuthBadge;
