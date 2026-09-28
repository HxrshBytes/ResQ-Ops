"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, AlertTriangle, Lock, User, ChevronRight, Zap } from "lucide-react";

const DEMO_CREDS = [
  { role: "COMMANDER", email: "commander@ndma.gov.in", passcode: "ResQ-Ops#2026", icon: "🛡️", label: "Commander", color: "#ef4444", desc: "Full dispatch & HITL command" },
  { role: "RESPONDER", email: "sentry.field@ndrf.gov.in", passcode: "Sentry#Field99", icon: "🚨", label: "Field Responder", color: "#f59e0b", desc: "Field triage & sentry squad" },
  { role: "AUDITOR", email: "sec.audit@cert-in.gov.in", passcode: "Audit#CERT2026", icon: "🔒", label: "Security Auditor", color: "#8b5cf6", desc: "Audit & threat inspection" },
  { role: "CITIZEN", email: "citizen@resq-ops.gov.in", passcode: "Citizen#Public", icon: "📱", label: "Citizen", color: "#34d399", desc: "Public SOS & advisory" },
];

function Particle({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: "absolute", borderRadius: "50%", pointerEvents: "none", ...style }} />;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [activeTab, setActiveTab] = useState<"STAFF" | "CITIZEN">("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<null | typeof DEMO_CREDS[0]>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fillDemo = (cred: typeof DEMO_CREDS[0]) => {
    setSelectedDemo(cred);
    setIdentifier(cred.email);
    setPassword(cred.passcode);
    setError(null);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return setError("Please enter your credentials");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, badgeId: identifier, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(data.redirectTo || redirectPath), 800);
      } else {
        setError(data.error || "Authentication failed. Check credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Animated background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-15%", left: "-10%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
          animation: "pulse-orb 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-10%",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
          animation: "pulse-orb 8s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)",
          width: "900px", height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.15), rgba(52,211,153,0.15), transparent)",
        }} />
        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div style={{
        width: "100%", maxWidth: "920px",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0", borderRadius: "24px", overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>

        {/* LEFT PANEL — Branding */}
        <div style={{
          background: "linear-gradient(135deg, #0d1525 0%, #0a0f1c 100%)",
          padding: "48px 40px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 60%)", transform: "translate(30%, -30%)" }} />

          {/* Logo */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 24px rgba(239,68,68,0.4)",
              }}>
                <Shield size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                  ResQ<span style={{ color: "#ef4444" }}>-Ops</span>
                </div>
                <div style={{ fontSize: "10px", color: "#475569", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Emergency Command
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: "16px", letterSpacing: "-0.04em" }}>
              Mission-Critical<br />
              <span style={{ background: "linear-gradient(90deg, #ef4444, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Command Access
              </span>
            </h1>
            <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.7, marginBottom: "40px" }}>
              Secure authentication for NDMA, NDRF, and CERT-In authorized personnel only. All sessions are HMAC-signed and audit-logged.
            </p>

            {/* Status indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "End-to-End Encrypted", icon: "🔐", ok: true },
                { label: "HMAC Session Signed", icon: "✅", ok: true },
                { label: "Audit Logging Active", icon: "📋", ok: true },
                { label: "Multi-Factor Ready", icon: "📱", ok: true },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px" }}>{s.icon}</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{s.label}</span>
                  <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Demo credentials */}
          <div>
            <div style={{ fontSize: "10px", color: "#334155", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              Demo Access — Click to Fill
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {DEMO_CREDS.map(cred => (
                <button key={cred.role} onClick={() => fillDemo(cred)} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
                  background: selectedDemo?.role === cred.role ? `${cred.color}15` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selectedDemo?.role === cred.role ? cred.color + "40" : "rgba(255,255,255,0.05)"}`,
                  transition: "all 0.2s", textAlign: "left",
                }}>
                  <span style={{ fontSize: "16px" }}>{cred.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: selectedDemo?.role === cred.role ? cred.color : "#94a3b8" }}>
                      {cred.label}
                    </div>
                    <div style={{ fontSize: "10px", color: "#334155" }}>{cred.desc}</div>
                  </div>
                  <ChevronRight size={12} color={selectedDemo?.role === cred.role ? cred.color : "#334155"} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Login Form */}
        <div style={{ background: "#0d1525", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Tab Toggle */}
          <div style={{
            display: "flex", gap: "4px", marginBottom: "36px",
            background: "rgba(0,0,0,0.4)", padding: "4px", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
            {(["STAFF", "CITIZEN"] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setError(null); }} style={{
                flex: 1, padding: "10px 16px", borderRadius: "8px", border: "none",
                background: activeTab === tab
                  ? (tab === "STAFF" ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #34d399, #10b981)")
                  : "transparent",
                color: activeTab === tab ? "#fff" : "#475569",
                fontWeight: 700, fontSize: "13px", cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: activeTab === tab ? (tab === "STAFF" ? "0 4px 16px rgba(239,68,68,0.3)" : "0 4px 16px rgba(52,211,153,0.3)") : "none",
              }}>
                {tab === "STAFF" ? "🛡️ Agency Staff" : "📱 Citizen"}
              </button>
            ))}
          </div>

          {/* STAFF LOGIN */}
          {activeTab === "STAFF" && (
            <form onSubmit={handleStaffLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "6px", letterSpacing: "-0.02em" }}>
                  Staff Authentication
                </div>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  Use your agency email or badge ID
                </div>
              </div>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 16px", background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px",
                  animation: "shake 0.3s ease",
                }}>
                  <AlertTriangle size={15} color="#ef4444" />
                  <span style={{ color: "#ef4444", fontSize: "13px" }}>{error}</span>
                </div>
              )}

              {success && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 16px", background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.25)", borderRadius: "10px",
                }}>
                  <Zap size={15} color="#34d399" />
                  <span style={{ color: "#34d399", fontSize: "13px" }}>Authenticated! Redirecting...</span>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Email or Badge ID
                </label>
                <div style={{ position: "relative" }}>
                  <User size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="commander@ndma.gov.in or NDMA-HQ-8921"
                    style={{
                      width: "100%", padding: "12px 14px 12px 40px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                      transition: "border-color 0.2s", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Passcode
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: "100%", padding: "12px 44px 12px 40px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                      transition: "border-color 0.2s", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#475569",
                  }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading || success} style={{
                width: "100%", padding: "14px",
                background: success ? "linear-gradient(135deg, #34d399, #10b981)" : loading ? "rgba(239,68,68,0.5)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 800, fontSize: "14px", cursor: loading || success ? "not-allowed" : "pointer",
                boxShadow: success ? "0 4px 20px rgba(52,211,153,0.4)" : "0 4px 20px rgba(239,68,68,0.4)",
                transition: "all 0.3s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                {loading ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Authenticating...
                  </>
                ) : success ? (
                  <> ✓ Authenticated! Redirecting... </>
                ) : (
                  <> <Shield size={16} /> Access Command Center </>
                )}
              </button>

              {selectedDemo && (
                <div style={{
                  padding: "12px 14px", borderRadius: "10px",
                  background: `${selectedDemo.color}08`,
                  border: `1px solid ${selectedDemo.color}25`,
                  fontSize: "11px", color: "#64748b", lineHeight: 1.8,
                }}>
                  <span style={{ color: selectedDemo.color, fontWeight: 700 }}>{selectedDemo.icon} {selectedDemo.label}</span> credentials filled.
                  Click <strong style={{ color: "#f0f4ff" }}>Access Command Center</strong> to log in.
                </div>
              )}
            </form>
          )}

          {/* CITIZEN TAB */}
          {activeTab === "CITIZEN" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "6px", letterSpacing: "-0.02em" }}>
                  Citizen Emergency Access
                </div>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  No account required. Report SOS instantly and anonymously.
                </div>
              </div>

              <Link href="/citizen" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                padding: "18px", borderRadius: "12px", textDecoration: "none",
                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                color: "#fff", fontWeight: 800, fontSize: "15px",
                boxShadow: "0 4px 24px rgba(220,38,38,0.4)",
                animation: "pulse-btn 2s ease-in-out infinite",
              }}>
                🆘 Report Emergency SOS
              </Link>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { label: "National Emergency", num: "112", icon: "🆘" },
                  { label: "NDMA Helpline", num: "1078", icon: "🌊" },
                  { label: "Ambulance", num: "108", icon: "🚑" },
                ].map(h => (
                  <div key={h.num} style={{
                    padding: "14px 10px", borderRadius: "10px", textAlign: "center",
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>{h.icon}</div>
                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>{h.num}</div>
                    <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{h.label}</div>
                  </div>
                ))}
              </div>

              <Link href="/chat" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "14px", borderRadius: "10px", textDecoration: "none",
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
                color: "#34d399", fontWeight: 700, fontSize: "13px",
              }}>
                ⚡ Ask WeatherGPT for Safety Advice
              </Link>

              <div style={{
                padding: "14px", borderRadius: "10px",
                background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.1)",
                fontSize: "11px", color: "#475569", lineHeight: 1.7,
                display: "flex", gap: "8px",
              }}>
                <span style={{ marginTop: "2px", flexShrink: 0 }}>🔒</span>
                <span>Your report is encrypted and shared only with authorized emergency responders. Anonymity is preserved.</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
            <Link href="/" style={{ fontSize: "12px", color: "#334155", textDecoration: "none" }}>
              ← Back to ResQ-Ops Home
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes pulse-orb { 0%,100%{opacity:0.8;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes pulse-btn { 0%,100%{box-shadow:0 4px 24px rgba(220,38,38,0.4)} 50%{box-shadow:0 4px 36px rgba(220,38,38,0.65)} }
        input::placeholder { color: #334155; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0d1525 inset; -webkit-text-fill-color: #f0f4ff; }
        @media (max-width: 700px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
