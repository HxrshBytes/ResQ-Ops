"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

interface WeatherStrip {
  temperature_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  weather_code: number;
  relative_humidity_2m: number;
}

const WMO_LABEL: Record<number, string> = {
  0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 51: "Drizzle", 61: "Rain", 63: "Moderate rain", 65: "Heavy rain",
  80: "Showers", 81: "Moderate showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm+hail",
};

// Leaflet must be dynamically imported (no SSR)
const MapView = dynamic(() => import("../components/MapView"), { ssr: false, loading: () => (
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading map…</span>
  </div>
) });

interface Incident {
  id: string; type: string; severity: string; lat: number; lon: number;
  location: string; description: string; reportedBy: string; status: string;
  confidence: number; opi: number; weatherScore: number; spatialScore: number;
  evidenceScore: number; affectedCount: number; createdAt: string; updatedAt: string;
  auditLog: Array<{ ts: string; action: string; user: string }>;
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--critical)", HIGH: "var(--high)", MODERATE: "var(--moderate)", LOW: "var(--low)",
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: "var(--text-muted)", AUTO_EVALUATED: "var(--moderate)",
  COMMANDER_APPROVED: "var(--info)", ASSIGNED: "var(--teal-bright)",
  EN_ROUTE: "var(--low)", RESOLVED: "#6b7280", REJECTED: "var(--critical)",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tab, setTab] = useState<"queue" | "log">("queue");
  const [weather, setWeather] = useState<WeatherStrip | null>(null);
  const [wxLoc, setWxLoc] = useState("Mumbai");

  const fetchIncidents = useCallback(async () => {
    const res = await fetch("/api/incidents");
    const data = await res.json();
    setIncidents(data);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 8000); // Poll every 8s (simulates WebSocket)
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  useEffect(() => {
    // Fetch weather for dashboard strip (Mumbai as representative city)
    fetch("/api/weather?lat=19.076&lon=72.877&loc=Mumbai")
      .then((r) => r.json())
      .then((d) => { setWeather(d.current ?? null); setWxLoc(d.location ?? "Mumbai"); })
      .catch(() => {});
  }, []);

  const handleAction = async (id: string, status: string) => {
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, user: "cmd-dashboard" }),
    });
    await fetchIncidents();
    if (selected?.id === id) {
      const updated = incidents.find((i) => i.id === id);
      if (updated) setSelected({ ...updated, status });
    }
  };

  const pendingCount = incidents.filter((i) => i.status === "AUTO_EVALUATED").length;
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL").length;
  const activeCount = incidents.filter((i) => !["RESOLVED", "REJECTED"].includes(i.status)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-void)", color: "var(--text-primary)", overflow: "hidden" }}>


      {/* ── Sub-header: Stats & Weather ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", background: "var(--bg-base)", borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 12 }}>
          <StatPill label="PENDING" value={pendingCount} color="var(--moderate)" />
          <StatPill label="CRITICAL" value={criticalCount} color="var(--critical)" />
          <StatPill label="ACTIVE" value={activeCount} color="var(--low)" />
        </div>
        
        {weather && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}>
              <span>📍</span>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{wxLoc}</span>
            </div>
            {[
              { icon: "🌡️", val: `${weather.temperature_2m}°C`, label: "Temp" },
              { icon: "🌧️", val: `${weather.precipitation} mm`, label: "Precip" },
              { icon: "💨", val: `${weather.wind_speed_10m} km/h`, label: "Wind" },
              { icon: "💧", val: `${weather.relative_humidity_2m}%`, label: "RH" },
              { icon: "☁️", val: WMO_LABEL[weather.weather_code] ?? "Unknown", label: "Cond" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>{item.icon}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>{item.val}</span>
                <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 12 }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>{lastUpdate?.toLocaleTimeString("en-IN") ?? "—"}</span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--low)", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 380px", flex: 1, overflow: "hidden", gap: 0 }}>

        {/* ── LEFT: Triage Queue ── */}
        <aside style={{ borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
            {(["queue", "log"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "6px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                background: tab === t ? "var(--bg-elevated)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                fontFamily: "var(--font-mono)",
              }}>{t === "queue" ? "Triage Queue" : "Audit Log"}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-surface" style={{ height: 90, borderRadius: "var(--radius-md)", opacity: 0.4 }} />
              ))
            ) : tab === "queue" ? (
              incidents.map((inc) => (
                <IncidentRow key={inc.id} inc={inc} selected={selected?.id === inc.id} onClick={() => setSelected(inc)} />
              ))
            ) : (
              incidents.flatMap((inc) =>
                inc.auditLog.map((log, j) => (
                  <div key={`${inc.id}-${j}`} className="glass-surface" style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--info)", fontWeight: 600 }}>{inc.id}</span>
                      <span style={{ color: "var(--text-muted)" }} suppressHydrationWarning>{timeAgo(log.ts)}</span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>{log.action}</div>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>by {log.user}</div>
                  </div>
                ))
              ).sort(() => -1)
            )}
          </div>
        </aside>

        {/* ── CENTER: Map ── */}
        <main style={{ position: "relative", overflow: "hidden" }}>
          <MapView incidents={incidents} selected={selected} onSelectIncident={(inc) => setSelected(inc as unknown as Incident)} />
        </main>

        {/* ── RIGHT: Incident Detail / HITL ── */}
        <aside style={{ borderLeft: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selected ? (
            <IncidentDetail inc={selected} onAction={handleAction} onClose={() => setSelected(null)} />
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--text-muted)", padding: 24 }}>
              <span style={{ fontSize: "2rem" }}>🗺️</span>
              <span style={{ fontSize: "0.85rem", textAlign: "center" }}>Select an incident on the map or queue to view details and dispatch options</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
      background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 99,
    }}>
      <span style={{ color, fontWeight: 700, fontSize: "0.9rem" }}>{value}</span>
      <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
    </div>
  );
}

function IncidentRow({ inc, selected, onClick }: { inc: Incident; selected: boolean; onClick: () => void }) {
  const needsAction = inc.status === "AUTO_EVALUATED";
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px", borderRadius: "var(--radius-md)", cursor: "pointer",
      background: selected ? "var(--bg-elevated)" : "transparent",
      borderTop: selected ? `1px solid var(--border-default)` : "1px solid transparent",
      borderRight: selected ? `1px solid var(--border-default)` : "1px solid transparent",
      borderBottom: selected ? `1px solid var(--border-default)` : "1px solid transparent",
      borderLeft: `3px solid ${SEV_COLOR[inc.severity] ?? "var(--text-muted)"}`,
      transition: "all 0.15s",
      position: "relative",
    }}>
      {needsAction && (
        <div style={{ position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: "50%", background: "var(--moderate)", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--info)" }}>{inc.id}</span>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, marginTop: 1 }}>{inc.type}</div>
        </div>
        <div style={{
          padding: "2px 8px", borderRadius: 99, fontSize: "0.62rem", fontWeight: 700,
          fontFamily: "var(--font-mono)", textTransform: "uppercase",
          background: `${SEV_COLOR[inc.severity]}18`, color: SEV_COLOR[inc.severity],
          border: `1px solid ${SEV_COLOR[inc.severity]}40`,
        }}>{inc.severity}</div>
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 6, display: "flex", gap: 4 }}>
        📍 {inc.location}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <OPIBadge opi={inc.opi} />
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }} suppressHydrationWarning>{timeAgo(inc.createdAt)}</span>
      </div>
    </div>
  );
}

function OPIBadge({ opi }: { opi: number }) {
  const color = opi >= 80 ? "var(--critical)" : opi >= 60 ? "var(--high)" : opi >= 40 ? "var(--moderate)" : "var(--low)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>OPI</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 800, color, fontFamily: "var(--font-mono)" }}>{opi}/100</span>
    </div>
  );
}

function IncidentDetail({ inc, onAction, onClose }: { inc: Incident; onAction: (id: string, s: string) => void; onClose: () => void }) {
  const canApprove = inc.status === "AUTO_EVALUATED";
  const canDispatch = inc.status === "COMMANDER_APPROVED";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--info)", marginBottom: 2 }}>{inc.id}</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{inc.type}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Location */}
        <div className="glass-surface" style={{ padding: 14, marginBottom: 12, borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Location</div>
          <div style={{ fontSize: "0.85rem" }}>📍 {inc.location}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
            {inc.lat.toFixed(4)}°N, {inc.lon.toFixed(4)}°E
          </div>
        </div>

        {/* OPI Breakdown */}
        <div className="glass-surface" style={{ padding: 14, marginBottom: 12, borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Operational Priority Index</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: inc.opi >= 80 ? "var(--critical)" : inc.opi >= 60 ? "var(--high)" : "var(--moderate)" }}>
              {inc.opi}
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/100</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Weather Correlation", val: inc.weatherScore, weight: "35%" },
              { label: "Spatial Density", val: inc.spatialScore, weight: "25%" },
              { label: "Evidence Score", val: inc.evidenceScore, weight: "25%" },
              { label: "Accessibility", val: 1 - (inc.opi < 60 ? 0.3 : 0.1), weight: "15%" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{s.label}</span>
                  <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {(s.val * 100).toFixed(0)}% <span style={{ opacity: 0.5 }}>× {s.weight}</span>
                  </span>
                </div>
                <div className="risk-bar">
                  <div className="risk-fill risk-high" style={{ width: `${s.val * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence */}
        <div className="glass-surface" style={{ padding: 14, marginBottom: 12, borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Distress Confidence</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: inc.confidence >= 0.85 ? "var(--low)" : "var(--moderate)" }}>
              {(inc.confidence * 100).toFixed(0)}%
            </div>
            <div style={{ flex: 1 }}>
              <div className="risk-bar">
                <div className="risk-fill" style={{
                  width: `${inc.confidence * 100}%`,
                  background: inc.confidence >= 0.85 ? "linear-gradient(90deg, #22d17e, #60ffb0)" : "linear-gradient(90deg, #f5c518, #ffe060)",
                }} />
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
                {inc.confidence >= 0.9 ? "Auto-verified" : inc.confidence >= 0.7 ? "High confidence" : "Manual review required"}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass-surface" style={{ padding: 14, marginBottom: 12, borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Report</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{inc.description}</p>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-info">👥 {inc.affectedCount} affected</span>
            <span className="badge" style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>📡 {inc.reportedBy}</span>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Status:</span>
          <span style={{
            fontSize: "0.72rem", fontFamily: "var(--font-mono)", fontWeight: 700,
            color: STATUS_COLOR[inc.status] ?? "var(--text-muted)",
            padding: "2px 8px", borderRadius: 99,
            background: `${STATUS_COLOR[inc.status] ?? "var(--text-muted)"}18`,
          }}>{inc.status.replace(/_/g, " ")}</span>
        </div>
      </div>

      {/* ── HITL Actions ── */}
      <div style={{ padding: 16, borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
        {canApprove && (
          <>
            <div style={{ fontSize: "0.72rem", color: "var(--moderate)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--moderate)", display: "inline-block", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
              Awaiting Commander Decision
            </div>
            <button className="btn btn-approve" style={{ width: "100%" }} onClick={() => onAction(inc.id, "COMMANDER_APPROVED")}>
              ✅ Approve &amp; Queue for Dispatch
            </button>
            <button className="btn btn-reject" style={{ width: "100%" }} onClick={() => onAction(inc.id, "REJECTED")}>
              ✕ Reject — Mark False Positive
            </button>
          </>
        )}
        {canDispatch && (
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onAction(inc.id, "ASSIGNED")}>
            🚑 Dispatch Nearest Unit
          </button>
        )}
        {inc.status === "ASSIGNED" && (
          <button className="btn btn-teal" style={{ width: "100%" }} onClick={() => onAction(inc.id, "EN_ROUTE")}>
            🛻 Mark En-Route
          </button>
        )}
        {inc.status === "EN_ROUTE" && (
          <button className="btn btn-approve" style={{ width: "100%" }} onClick={() => onAction(inc.id, "RESOLVED")}>
            ✔ Mark Resolved
          </button>
        )}
        {["RESOLVED", "REJECTED"].includes(inc.status) && (
          <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", padding: 8 }}>
            {inc.status === "RESOLVED" ? "✔ Incident closed" : "✕ Marked as false positive"}
          </div>
        )}
      </div>
    </div>
  );
}
