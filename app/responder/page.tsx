"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import UserAuthBadge from "../components/UserAuthBadge";

interface Incident {
  id: string; type: string; severity: string; location: string;
  description: string; status: string; opi: number; lat: number; lon: number;
  affectedCount: number; createdAt: string;
}

const STATUS_FLOW: Record<string, string> = {
  COMMANDER_APPROVED: "ASSIGNED",
  ASSIGNED: "EN_ROUTE",
  EN_ROUTE: "RESOLVED",
};

const STATUS_LABEL: Record<string, string> = {
  COMMANDER_APPROVED: "🚑 Accept & Start Navigation",
  ASSIGNED: "🛣️ Mark En-Route",
  EN_ROUTE: "✅ Mark Resolved",
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--critical)", HIGH: "var(--high)", MODERATE: "var(--moderate)", LOW: "var(--low)",
};

export default function ResponderPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [myUnit] = useState("SDRF-UNIT-04");

  useEffect(() => {
    const fetch_ = () => fetch("/api/incidents").then((r) => r.json()).then((data) =>
      setIncidents(data.filter((i: Incident) => !["SUBMITTED", "REJECTED", "RESOLVED", "AUTO_EVALUATED"].includes(i.status)))
    );
    fetch_();
    const t = setInterval(fetch_, 6000);
    return () => clearInterval(t);
  }, []);

  const advance = async (inc: Incident) => {
    const next = STATUS_FLOW[inc.status];
    if (!next) return;
    setUpdating(inc.id);
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inc.id, status: next, user: myUnit }),
    });
    setIncidents((prev) => prev.filter((i) => next === "RESOLVED" ? i.id !== inc.id : true)
      .map((i) => i.id === inc.id ? { ...i, status: next } : i));
    setUpdating(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)", color: "var(--text-primary)" }}>


      {/* Unit Status Bar */}
      <div style={{ padding: "12px 16px", background: "rgba(34,209,126,0.06)", borderBottom: "1px solid rgba(34,209,126,0.2)" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--low)", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.78rem", color: "var(--low)", fontWeight: 600 }}>ACTIVE</span>
          </div>
          {[
            { label: "Unit", val: myUnit },
            { label: "Vehicle", val: "High-Axle Truck" },
            { label: "Capacity", val: "20 pax" },
            { label: "GPS", val: "19.0760°N, 72.8777°E" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}:</span>
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Queue */}
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Assigned Incidents ({incidents.length})
          </div>
        </div>

        {incidents.length === 0 ? (
          <div className="glass-surface" style={{ padding: 32, borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>✅</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No assigned incidents. Standby mode.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {incidents.map((inc) => {
              const col = SEV_COLOR[inc.severity] ?? "var(--text-muted)";
              const nextAction = STATUS_LABEL[inc.status];
              return (
                <div key={inc.id} className="glass-surface" style={{
                  borderRadius: "var(--radius-lg)", overflow: "hidden",
                  borderLeft: `4px solid ${col}`,
                }}>
                  {/* Card header */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--info)", marginBottom: 2 }}>{inc.id}</div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{inc.type}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>📍 {inc.location}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                        color: col, background: `${col}15`, border: `1px solid ${col}40`,
                        padding: "3px 10px", borderRadius: 99, fontFamily: "var(--font-mono)",
                      }}>{inc.severity}</div>
                      <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: col, fontWeight: 800, marginTop: 6 }}>OPI {inc.opi}/100</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>{inc.description}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                      <div className="glass-surface" style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>AFFECTED</div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{inc.affectedCount} pax</div>
                      </div>
                      <div className="glass-surface" style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>STATUS</div>
                        <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--teal-bright)" }}>{inc.status.replace(/_/g, " ")}</div>
                      </div>
                      <div className="glass-surface" style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>COORDS</div>
                        <div style={{ fontWeight: 600, fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--info)" }}>
                          {inc.lat.toFixed(3)}°N<br/>{inc.lon.toFixed(3)}°E
                        </div>
                      </div>
                    </div>

                    {/* Route card */}
                    <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "rgba(59,158,255,0.06)", border: "1px solid rgba(59,158,255,0.2)", marginBottom: 14, fontSize: "0.78rem" }}>
                      <div style={{ color: "var(--info)", fontWeight: 600, marginBottom: 4 }}>🗺️ Navigation Route</div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        Via State Highway 4 → NH-48 → {inc.location}<br />
                        <span style={{ color: "var(--moderate)" }}>⚠️ Note: Low-lying stretch (km 14-17) may be waterlogged. Take bypass via Ring Road.</span>
                      </div>
                    </div>

                    {nextAction && (
                      <button
                        className="btn btn-primary"
                        style={{ width: "100%", opacity: updating === inc.id ? 0.6 : 1 }}
                        disabled={updating === inc.id}
                        onClick={() => advance(inc)}
                      >
                        {updating === inc.id ? "⏳ Updating…" : nextAction}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
