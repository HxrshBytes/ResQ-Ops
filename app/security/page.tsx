"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AuditLogEntry } from "@/lib/auth";

export default function SecurityAuditPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [testPayload, setTestPayload] = useState(`{"sosId":"SOS-8819","lat":11.75,"lon":76.10}`);
  const [testSig, setTestSig] = useState("");
  const [sigResult, setSigResult] = useState<boolean | null>(null);

  const fetchSecurityState = () => {
    fetch("/api/security")
      .then((res) => res.json())
      .then((data) => {
        setTelemetry(data);
        setLockdownActive(data.lockdownActive);
        if (data.sampleIntegrityCheck) {
          setTestSig(data.sampleIntegrityCheck.signature);
        }
      })
      .catch((err) => console.error("Failed to load security telemetry", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSecurityState();
    const interval = setInterval(fetchSecurityState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLockdown = async () => {
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_LOCKDOWN" }),
      });
      const data = await res.json();
      if (res.ok) setLockdownActive(data.lockdownActive);
    } catch {
      alert("Failed to toggle lockdown");
    }
  };

  const handleVerifySignature = async () => {
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_PAYLOAD", payload: testPayload, signature: testSig }),
      });
      const data = await res.json();
      setSigResult(data.valid);
    } catch {
      setSigResult(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-void)", minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* Header */}
      <nav style={{
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-default)",
        background: "rgba(4,8,16,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            ← Command Dashboard
          </Link>
          <div style={{ width: 1, height: 20, background: "var(--border-subtle)" }} />
          <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>
            🔒 <span style={{ color: "var(--info)" }}>SECURITY SOC & AUDIT CONSOLE</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={handleToggleLockdown}
            className={`btn ${lockdownActive ? "btn-primary" : "btn-secondary"}`}
            style={{
              padding: "8px 16px",
              fontSize: "0.8rem",
              background: lockdownActive ? "var(--red-vivid)" : undefined,
              boxShadow: lockdownActive ? "0 0 20px rgba(255,43,74,0.6)" : undefined,
            }}
          >
            {lockdownActive ? "🚨 EMERGENCY LOCKDOWN ACTIVE (CLICK TO UNLOCK)" : "🔒 TRIGGER SYSTEM LOCKDOWN"}
          </button>
        </div>
      </nav>

      {/* Main Grid */}
      <div style={{ maxWidth: 1240, margin: "32px auto", padding: "0 24px" }}>

        {/* System Lockdown Warning */}
        {lockdownActive && (
          <div style={{
            background: "rgba(255,43,74,0.18)",
            border: "2px solid var(--critical)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ff7085" }}>
                🚨 EMERGENCY LOCKDOWN PROTOCOL ENGAGED
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>
                All non-essential API endpoints, public SOS ingestion streams, and WeatherGPT synthesis external calls are restricted.
              </div>
            </div>
            <span className="badge badge-critical" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>LOCKDOWN LEVEL 4</span>
          </div>
        )}

        {/* Telemetry Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="glass-surface" style={{ padding: 20 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Sessions</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--info)", marginTop: 6 }}>
              {telemetry?.securityMetrics?.activeAuthSessions ?? "--"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--teal-bright)", marginTop: 4 }}>JWT AES-256 Validated</div>
          </div>

          <div className="glass-surface" style={{ padding: 20 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Blocked IP Attacks (24h)</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--high)", marginTop: 6 }}>
              {telemetry?.securityMetrics?.blockedIpAttempts24h ?? "--"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>Rate Limit Sliding Window</div>
          </div>

          <div className="glass-surface" style={{ padding: 20 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>HMAC Signature Mode</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--low)", marginTop: 10 }}>
              {telemetry?.securityMetrics?.hmacSignatureMode ?? "ENFORCED"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>Anti-Spoofing Active</div>
          </div>

          <div className="glass-surface" style={{ padding: 20 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Active Role</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginTop: 10 }}>
              {telemetry?.currentUser?.role ?? "SECURITY_AUDITOR"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--info)", marginTop: 4 }}>
              {telemetry?.currentUser?.badgeId ?? "CERTIN-SOC-909"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>

          {/* Anti-Tamper Payload Integrity Simulator */}
          <div className="glass-surface" style={{ padding: 24, borderRadius: 14 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              🛡️ Anti-Tamper HMAC Payload Validator
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 16 }}>
              Verifies if an incoming SOS distress packet has been modified in-transit or forged by unauthorized actors.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>RAW SOS PAYLOAD (JSON)</label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  style={{
                    width: "100%",
                    height: 70,
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    padding: 10,
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>SHA-256 HMAC SIGNATURE</label>
                <input
                  type="text"
                  value={testSig}
                  onChange={(e) => setTestSig(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    color: "var(--info)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                  }}
                />
              </div>

              <button onClick={handleVerifySignature} className="btn btn-teal" style={{ padding: "10px", fontSize: "0.82rem" }}>
                🔍 Run Signature Verification Check
              </button>

              {sigResult !== null && (
                <div style={{
                  padding: 10,
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background: sigResult ? "rgba(34,209,126,0.15)" : "rgba(255,43,74,0.15)",
                  border: `1px solid ${sigResult ? "rgba(34,209,126,0.4)" : "rgba(255,43,74,0.4)"}`,
                  color: sigResult ? "#22d17e" : "#ff8090",
                }}>
                  {sigResult ? "✅ SIGNATURE VALID — Payload origin authenticated and untouched." : "❌ SIGNATURE INVALID — Payload tampered or forged!"}
                </div>
              )}
            </div>
          </div>

          {/* Rate Limiting & Threat Rules */}
          <div className="glass-surface" style={{ padding: 24, borderRadius: 14 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              ⚡ Rate Limit & Anomaly Shield Controls
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                <span>🚨 Incident Ingestion API Limit</span>
                <strong style={{ color: "var(--teal-bright)" }}>60 req / min per IP</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                <span>🤖 WeatherGPT Synthesis Burst Limit</span>
                <strong style={{ color: "var(--info)" }}>20 req / min per User</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                <span>🔑 Failed Login Max Threshold</span>
                <strong style={{ color: "var(--high)" }}>10 attempts / 60s (Auto-Lock)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                <span>📡 BLE Mesh Broadcast Range Guard</span>
                <strong style={{ color: "var(--low)" }}>Max 255 bytes / packet</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Stream Table */}
        <div className="glass-surface" style={{ padding: 24, borderRadius: 14 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>📜 Real-Time Security Audit Trail</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Polling every 5s • SHA-256 Checksum Verified
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
                <th style={{ padding: "10px" }}>TIMESTAMP</th>
                <th style={{ padding: "10px" }}>USER / AGENCY</th>
                <th style={{ padding: "10px" }}>ROLE</th>
                <th style={{ padding: "10px" }}>ACTION</th>
                <th style={{ padding: "10px" }}>RESOURCE</th>
                <th style={{ padding: "10px" }}>IP</th>
                <th style={{ padding: "10px" }}>STATUS</th>
                <th style={{ padding: "10px" }}>CHECKSUM</th>
              </tr>
            </thead>
            <tbody>
              {telemetry?.auditTrail?.map((log: AuditLogEntry) => {
                const statusColor =
                  log.status === "SUCCESS"
                    ? "#22d17e"
                    : log.status === "BLOCKED"
                    ? "#ff2b4a"
                    : log.status === "DENIED"
                    ? "#ff6b1a"
                    : "#ffb703";

                return (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "10px", fontWeight: 600 }}>{log.userName}</td>
                    <td style={{ padding: "10px" }}>
                      <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.68rem" }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--info)" }}>
                      {log.action}
                    </td>
                    <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{log.resource}</td>
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono)" }}>{log.ip}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ color: statusColor, fontWeight: 700 }}>{log.status}</span>
                    </td>
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {log.checksum}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
