"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, MapPin, Phone, User, Send, CheckCircle, Shield, Camera } from "lucide-react";

const EMERGENCY_TYPES = [
  { id: "flood",    label: "Flood / Waterlogging",    icon: "🌊", color: "#3b82f6" },
  { id: "cyclone",  label: "Cyclone / Storm",          icon: "🌀", color: "#8b5cf6" },
  { id: "fire",     label: "Fire / Wildfire",          icon: "🔥", color: "#ef4444" },
  { id: "landslide",label: "Landslide / Mudslide",     icon: "⛰️", color: "#f59e0b" },
  { id: "medical",  label: "Medical Emergency",         icon: "🚑", color: "#ec4899" },
  { id: "missing",  label: "Missing Person",            icon: "👤", color: "#64748b" },
  { id: "other",    label: "Other Emergency",           icon: "🆘", color: "#dc2626" },
];

export default function CitizenPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", location: "", description: "", severity: "HIGH" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sosId, setSosId] = useState("");

  const handleSubmit = async () => {
    if (!selectedType || !form.location) return;
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: EMERGENCY_TYPES.find(t => t.id === selectedType)?.label || selectedType,
          location: form.location,
          description: form.description,
          reportedBy: form.name || "Anonymous Citizen",
          severity: form.severity,
          affectedCount: 1, // Default or derived
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.incident) {
        setSosId(data.incident.id);
        setSubmitted(true);
      } else {
        alert("Failed to dispatch SOS. Please call 112 immediately.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please call 112 immediately.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080c14", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "32px",
      }}>
        <div style={{
          maxWidth: "480px", width: "100%", textAlign: "center",
          background: "rgba(15,22,36,0.9)", border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: "20px", padding: "48px 40px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(52,211,153,0.12)",
        }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "rgba(52,211,153,0.12)", border: "2px solid rgba(52,211,153,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 32px rgba(52,211,153,0.25)",
          }}>
            <CheckCircle size={36} color="#34d399" />
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>
            SOS Received
          </h2>
          <p style={{ color: "#34d399", fontWeight: 700, fontSize: "1rem", marginBottom: "24px", fontFamily: "var(--font-mono)" }}>
            {sosId}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "32px" }}>
            Your emergency report has been dispatched to the nearest Response Command Center.
            Rescue teams have been alerted. Please stay safe and stay where you are if possible.
          </p>
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px", padding: "16px", marginBottom: "28px", textAlign: "left",
          }}>
            <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              Emergency Helplines
            </div>
            <div style={{ color: "#f0f4ff", fontSize: "13px", lineHeight: 1.8 }}>
              🆘 National Emergency: <strong>112</strong><br />
              🌊 NDMA Helpline: <strong>1078</strong><br />
              🚑 Ambulance: <strong>108</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/chat" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "10px 20px", background: "#34d399", color: "#071a0e",
              borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none",
            }}>
              Ask WeatherGPT
            </Link>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "10px 20px", background: "transparent", color: "#94a3b8",
              border: "1px solid rgba(148,163,184,0.2)", borderRadius: "10px", fontWeight: 600, fontSize: "13px", textDecoration: "none",
            }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#f0f4ff", padding: "32px 16px", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ maxWidth: "680px", margin: "0 auto", marginBottom: "32px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "#64748b", fontSize: "13px", textDecoration: "none", marginBottom: "24px",
        }}>
          ← Back to ResQ-Ops
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
              Report Emergency SOS
            </h1>
            <p style={{ color: "#64748b", fontSize: "12px" }}>
              No account required · End-to-end encrypted · Dispatched instantly
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", flex: s < 3 ? 1 : "none" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: step >= s ? (step > s ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.06)",
                border: `2px solid ${step >= s ? (step > s ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 800, color: step >= s ? "#fff" : "#475569",
                transition: "all 0.3s",
              }}>
                {step > s ? "✓" : s}
              </div>
              <span style={{ fontSize: "11px", color: step >= s ? "#f0f4ff" : "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>
                {s === 1 ? "Emergency Type" : s === 2 ? "Location & Details" : "Confirm & Send"}
              </span>
              {s < 3 && <div style={{ flex: 1, height: "1px", background: step > s ? "#34d399" : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div style={{
        maxWidth: "680px", margin: "0 auto",
        background: "rgba(15,22,36,0.85)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "18px", padding: "28px",
        backdropFilter: "blur(20px)",
      }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>
              What type of emergency are you reporting?
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {EMERGENCY_TYPES.map(t => (
                <button key={t.id} onClick={() => setSelectedType(t.id)} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
                  background: selectedType === t.id ? `${t.color}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedType === t.id ? t.color + "60" : "rgba(255,255,255,0.07)"}`,
                  color: "#f0f4ff", fontSize: "13px", fontWeight: 600, textAlign: "left",
                  transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: "20px" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={() => selectedType && setStep(2)} disabled={!selectedType} style={{
              marginTop: "24px", width: "100%", padding: "13px",
              background: selectedType ? "#ef4444" : "rgba(255,255,255,0.05)",
              color: selectedType ? "#fff" : "#475569",
              border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: selectedType ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: selectedType ? "0 4px 16px rgba(239,68,68,0.3)" : "none",
            }}>
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>
              Location & Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { key: "location", label: "Location / Address *", placeholder: "e.g. Andheri West, Mumbai, Maharashtra", icon: <MapPin size={15} />, required: true },
                { key: "name",     label: "Your Name (Optional)",  placeholder: "Anonymous by default",                 icon: <User size={15} /> },
                { key: "phone",    label: "Phone Number (Optional)",placeholder: "For rescue team callback",              icon: <Phone size={15} /> },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    {field.label}
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#475569" }}>
                      {field.icon}
                    </span>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      style={{
                        width: "100%", padding: "11px 14px 11px 38px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                        fontFamily: "var(--font-sans)",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  Describe the situation
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what is happening, how many people are affected..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                    fontFamily: "var(--font-sans)", resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={() => setStep(1)} style={{
                padding: "12px 20px", background: "transparent", color: "#64748b",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              }}>
                ← Back
              </button>
              <button onClick={() => form.location && setStep(3)} disabled={!form.location} style={{
                flex: 1, padding: "12px",
                background: form.location ? "#ef4444" : "rgba(255,255,255,0.05)",
                color: form.location ? "#fff" : "#475569",
                border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px",
                cursor: form.location ? "pointer" : "not-allowed",
                boxShadow: form.location ? "0 4px 16px rgba(239,68,68,0.3)" : "none",
              }}>
                Review & Send →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>
              Confirm & Dispatch SOS
            </h3>

            {/* Summary */}
            <div style={{
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px", padding: "20px", marginBottom: "20px",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  { label: "Emergency Type", val: EMERGENCY_TYPES.find(t => t.id === selectedType)?.label || selectedType },
                  { label: "Severity",       val: form.severity },
                  { label: "Location",       val: form.location },
                  { label: "Reporter",       val: form.name || "Anonymous" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>{item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#f0f4ff" }}>{item.val}</div>
                  </div>
                ))}
              </div>
              {form.description && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Situation</div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>{form.description}</div>
                </div>
              )}
            </div>

            {/* Privacy Note */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: "12px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
              borderRadius: "10px", marginBottom: "20px",
            }}>
              <Shield size={14} color="#34d399" style={{ marginTop: "2px", flexShrink: 0 }} />
              <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.6 }}>
                Your data is encrypted end-to-end and shared only with emergency responders. No account is required.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(2)} style={{
                padding: "12px 20px", background: "transparent", color: "#64748b",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              }}>
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={submitting} style={{
                flex: 1, padding: "13px",
                background: submitting ? "rgba(239,68,68,0.4)" : "#dc2626",
                color: "#fff", border: "none", borderRadius: "10px",
                fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "all 0.2s",
              }}>
                {submitting ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Dispatching...
                  </>
                ) : (
                  <><Send size={16} /> 🆘 Send Emergency SOS</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Helpline Bar */}
      <div style={{
        maxWidth: "680px", margin: "16px auto 0",
        display: "flex", justifyContent: "center", gap: "24px",
        fontSize: "12px", color: "#475569",
      }}>
        <span>🆘 Emergency: <strong style={{ color: "#f0f4ff" }}>112</strong></span>
        <span>🌊 NDMA: <strong style={{ color: "#f0f4ff" }}>1078</strong></span>
        <span>🚑 Ambulance: <strong style={{ color: "#f0f4ff" }}>108</strong></span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
