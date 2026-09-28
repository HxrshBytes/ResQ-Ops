"use client";
import { useState } from "react";
import { MapPin, Navigation, Clock, Car, Truck, Bike, AlertTriangle, CheckCircle, Shield, Zap } from "lucide-react";

const VEHICLE_OPTIONS = [
  { value: "car",   label: "Car / SUV",           icon: <Car size={16} /> },
  { value: "bike",  label: "Two-Wheeler",          icon: <Bike size={16} /> },
  { value: "truck", label: "Heavy Vehicle (Truck)", icon: <Truck size={16} /> },
];

const RISK_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Critical Risk" },
  HIGH:     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  label: "High Risk"     },
  MODERATE: { color: "#eab308", bg: "rgba(234,179,8,0.1)",   label: "Moderate Risk" },
  LOW:      { color: "#34d399", bg: "rgba(52,211,153,0.1)",  label: "Low Risk"      },
};

export default function TravelPage() {
  const [form, setForm] = useState({ origin: "", destination: "", vehicle: "car", departure: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const assessRoute = async () => {
    if (!form.origin || !form.destination) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/route-safety/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to assess route. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const rc = (risk: string) => RISK_CONFIG[risk] || RISK_CONFIG.LOW;

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#080c14", color: "#f0f4ff", fontFamily: "var(--font-sans)" }}>

      {/* Page Header */}
      <div style={{
        background: "rgba(15,22,36,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 32px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "10px",
              background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Navigation size={20} color="#34d399" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                Route Safety Assessor
              </h1>
              <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                Real-time hazard scoring · Weather-aware routing · OSRM + Open-Meteo
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "livePulse 1.6s ease-in-out infinite" }} />
            Live Hazard Feed Active
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: result ? "420px 1fr" : "1fr", gap: "24px", alignItems: "start" }}>

          {/* ── FORM PANEL ───────────────────────── */}
          <div style={{
            background: "rgba(15,22,36,0.85)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px", padding: "24px", backdropFilter: "blur(16px)",
          }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>
              Journey Details
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Origin */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                  Origin
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#34d399" }} />
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Andheri"
                    value={form.origin}
                    onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 14px 10px 34px", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "9px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                  Destination
                </label>
                <div style={{ position: "relative" }}>
                  <Navigation size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#f97316" }} />
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    value={form.destination}
                    onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 14px 10px 34px", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "9px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                </div>
              </div>

              {/* Vehicle */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                  Vehicle Type
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {VEHICLE_OPTIONS.map(v => (
                    <button key={v.value} onClick={() => setForm(f => ({ ...f, vehicle: v.value }))} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                      padding: "10px 8px", borderRadius: "9px", cursor: "pointer",
                      background: form.vehicle === v.value ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${form.vehicle === v.value ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.07)"}`,
                      color: form.vehicle === v.value ? "#34d399" : "#64748b",
                      fontSize: "10px", fontWeight: 600, transition: "all 0.2s",
                    }}>
                      {v.icon}
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                  Departure Time
                </label>
                <div style={{ position: "relative" }}>
                  <Clock size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="datetime-local"
                    value={form.departure}
                    onChange={e => setForm(f => ({ ...f, departure: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 14px 10px 34px", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "9px", color: "#f0f4ff", fontSize: "13px", outline: "none",
                      fontFamily: "var(--font-sans)", colorScheme: "dark",
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={assessRoute}
                disabled={loading || !form.origin || !form.destination}
                style={{
                  width: "100%", padding: "13px",
                  background: (!form.origin || !form.destination) ? "rgba(52,211,153,0.2)" : "#34d399",
                  color: (!form.origin || !form.destination) ? "#34d399" : "#071a0e",
                  border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px",
                  cursor: (!form.origin || !form.destination) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "all 0.2s",
                  boxShadow: (!form.origin || !form.destination) ? "none" : "0 4px 20px rgba(52,211,153,0.3)",
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: "14px", height: "14px", border: "2px solid rgba(7,26,14,0.3)", borderTopColor: "#071a0e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Analyzing Hazards...
                  </>
                ) : (
                  <><Zap size={15} /> Assess Route Safety</>
                )}
              </button>

              {error && (
                <div style={{ padding: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "9px", color: "#f87171", fontSize: "12px" }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ── RESULTS PANEL ─────────────────────── */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Verdict Banner */}
              <div style={{
                padding: "18px 22px", borderRadius: "14px",
                background: rc(result.alternatives?.[0]?.overallRisk || "LOW").bg,
                border: `1px solid ${rc(result.alternatives?.[0]?.overallRisk || "LOW").color}40`,
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <Shield size={22} color={rc(result.alternatives?.[0]?.overallRisk || "LOW").color} />
                <div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Route Assessment Verdict</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{result.verdict}</div>
                </div>
                {result.bestDeparture && (
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>Best Departure</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#34d399" }}>{new Date(result.bestDeparture).toLocaleString("en-IN")}</div>
                  </div>
                )}
              </div>

              {/* Route Alternatives */}
              <div>
                <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  Route Alternatives
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {result.alternatives?.map((alt: any) => (
                    <div key={alt.id} style={{
                      padding: "18px 20px",
                      background: "rgba(15,22,36,0.85)", backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderLeft: `4px solid ${rc(alt.overallRisk).color}`,
                      borderRadius: "12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>{alt.id}</span>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px",
                            color: rc(alt.overallRisk).color,
                            background: rc(alt.overallRisk).bg,
                            border: `1px solid ${rc(alt.overallRisk).color}40`,
                          }}>
                            {rc(alt.overallRisk).label}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#94a3b8" }}>
                          <span>⏱ {alt.timeMins} mins</span>
                          <span>📏 {alt.distanceKm} km</span>
                        </div>
                      </div>

                      {/* Risk reasons */}
                      <ul style={{ paddingLeft: "16px", margin: "0 0 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {alt.reasons?.map((r: string, i: number) => (
                          <li key={i} style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>{r}</li>
                        ))}
                      </ul>

                      {/* Segment risk bar */}
                      {alt.segments?.length > 0 && (
                        <div>
                          <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Segment Risk</div>
                          <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", gap: "1px" }}>
                            {alt.segments.map((seg: any, i: number) => (
                              <div key={i}
                                style={{ flex: seg.km, background: rc(seg.risk).color, opacity: 0.8 }}
                                title={`${seg.km}km — ${seg.risk} RISK`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Amenities */}
              {result.nearbyAmenities && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px",
                }}>
                  {[
                    { label: "Emergency Shelters", items: result.nearbyAmenities.shelters, color: "#34d399" },
                    { label: "Hospitals",          items: result.nearbyAmenities.hospitals, color: "#ef4444" },
                    { label: "Fuel Stations",      items: result.nearbyAmenities.fuel, color: "#eab308" },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: "14px 16px",
                      background: "rgba(15,22,36,0.85)", backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px",
                    }}>
                      <div style={{ fontSize: "10px", color: item.color, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "8px" }}>
                        {item.label}
                      </div>
                      {item.items?.map((name: string) => (
                        <div key={name} style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>• {name}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              {result.disclaimer && (
                <div style={{ padding: "12px 16px", background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#78716c", lineHeight: 1.6 }}>⚠️ {result.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.75); }
        }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}
