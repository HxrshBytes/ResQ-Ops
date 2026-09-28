"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Alert {
  id: string; severity: string; event: string; area: string;
  lat: number; lon: number; radius_km: number;
  onset: string; expires: string; description: string;
  instructions: string; source: string; confidence: number; capXml?: string;
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--critical)", HIGH: "var(--high)", MODERATE: "var(--moderate)", LOW: "var(--low)",
};

function timeLabel(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (diff < 0) return `${h}h ${m}m ago`;
  return `in ${h}h ${m}m`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [showCap, setShowCap] = useState(false);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setAlerts(d);
          setSelected((prev) => prev || d[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch alerts", err));
    const t = setInterval(() => {
      fetch("/api/alerts")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setAlerts(d);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", background: "var(--bg-void)", color: "var(--text-primary)" }}>

      {/* Live Status Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", background: "var(--bg-base)",
        borderBottom: "1px solid var(--border-subtle)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            display: "inline-block", width: "7px", height: "7px", borderRadius: "50%",
            background: alerts.length > 0 ? "#ef4444" : "#22d17e",
            boxShadow: alerts.length > 0 ? "0 0 8px rgba(239,68,68,0.8)" : "0 0 8px rgba(34,209,126,0.8)",
            animation: "livePulse 1.6s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
            {alerts.length > 0 ? `${alerts.length} Active Alert${alerts.length > 1 ? "s" : ""}` : "No Active Alerts"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>· Auto-refreshes every 30s</span>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          NDMA CAP-XML v1.2 Feed
        </span>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "8px 20px",
        background: "var(--bg-base)", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0,
      }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filter Severity</span>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL", "CRITICAL", "HIGH", "MODERATE"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: "0.72rem", fontWeight: 700,
              background: filter === f ? (f === "ALL" ? "var(--bg-elevated)" : `${SEV_COLOR[f]}18`) : "transparent",
              color: filter === f ? (f === "ALL" ? "var(--text-primary)" : SEV_COLOR[f]) : "var(--text-muted)",
              border: filter === f ? `1px solid ${f === "ALL" ? "var(--border-default)" : SEV_COLOR[f] + "60"}` : "1px solid transparent",
            }}>{f}</button>
          ))}
          <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: "0.72rem", padding: "4px 12px" }}>🖥️ Dashboard</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", flex: 1, overflow: "hidden" }}>

        {/* Alert List */}
        <aside style={{ borderRight: "1px solid var(--border-subtle)", overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((alert) => {
            const col = SEV_COLOR[alert.severity] ?? "var(--text-muted)";
            return (
              <div key={alert.id} onClick={() => setSelected(alert)} style={{
                padding: "14px 16px", borderRadius: "var(--radius-md)", cursor: "pointer",
                background: selected?.id === alert.id ? "var(--bg-elevated)" : "transparent",
                borderTop: `1px solid ${selected?.id === alert.id ? "var(--border-default)" : "transparent"}`,
                borderRight: `1px solid ${selected?.id === alert.id ? "var(--border-default)" : "transparent"}`,
                borderBottom: `1px solid ${selected?.id === alert.id ? "var(--border-default)" : "transparent"}`,
                borderLeft: `3px solid ${col}`,
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{alert.id}</span>
                  <span style={{
                    fontSize: "0.62rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase",
                    color: col, background: `${col}18`, padding: "2px 8px", borderRadius: 99, border: `1px solid ${col}40`,
                  }}>{alert.severity}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>{alert.event}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6 }}>📍 {alert.area}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  <span suppressHydrationWarning>Onset: {timeLabel(alert.onset)}</span>
                  <span suppressHydrationWarning>Expires: {timeLabel(alert.expires)}</span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Alert Detail */}
        <main style={{ overflowY: "auto", padding: 32 }}>
          {selected ? (
            <div className="animate-fade-in" style={{ maxWidth: 700 }}>
              {/* Severity banner */}
              <div style={{
                padding: "16px 24px", borderRadius: "var(--radius-lg)", marginBottom: 24,
                background: `${SEV_COLOR[selected.severity]}12`,
                border: `1px solid ${SEV_COLOR[selected.severity]}40`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: SEV_COLOR[selected.severity], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    {selected.severity} ALERT — {selected.id}
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{selected.event}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Source</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{selected.source}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--low)", marginTop: 4 }}>Confidence: {(selected.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              {/* Coverage */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Affected Area", val: selected.area },
                  { label: "Radius", val: `${selected.radius_km} km` },
                  { label: "Coordinates", val: `${selected.lat.toFixed(3)}°N, ${selected.lon.toFixed(3)}°E` },
                ].map((item) => (
                  <div key={item.label} className="glass-surface" style={{ padding: 16, borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div className="glass-surface" style={{ padding: 16, borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Onset</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{new Date(selected.onset).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--info)", marginTop: 2 }} suppressHydrationWarning>{timeLabel(selected.onset)}</div>
                </div>
                <div className="glass-surface" style={{ padding: 16, borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Expires</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{new Date(selected.expires).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--moderate)", marginTop: 2 }} suppressHydrationWarning>{timeLabel(selected.expires)}</div>
                </div>
              </div>

              {/* Description */}
              <div className="glass-surface" style={{ padding: 20, borderRadius: "var(--radius-md)", marginBottom: 20 }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Situation Report</div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{selected.description}</p>
              </div>

              {/* Instructions */}
              <div style={{ padding: 20, borderRadius: "var(--radius-md)", marginBottom: 20, background: "rgba(34,209,126,0.06)", border: "1px solid rgba(34,209,126,0.25)" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--low)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>⚡ Immediate Instructions</div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{selected.instructions}</p>
              </div>

              {/* CAP-XML */}
              {selected.capXml && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <button className="btn btn-ghost" style={{ fontSize: "0.78rem" }} onClick={() => setShowCap((v) => !v)}>
                      {showCap ? "▲ Hide" : "▼ Show"} CAP-XML Payload (ITU-T v1.2)
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: "0.78rem", display: "flex", gap: "6px", alignItems: "center", padding: "6px 12px", background: "var(--critical)" }}
                      onClick={async () => {
                        const res = await fetch("/api/cap-alerts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            capXmlPayload: selected.capXml,
                            zoneCoordinates: { lat: selected.lat, lon: selected.lon, radius_km: selected.radius_km },
                            hazardLevel: selected.severity
                          })
                        });
                        const data = await res.json();
                        if (data.status === "success") {
                          alert(`SACHET Broadcast Transmitted Successfully!\nTowers Activated: ${data.transmission_details.towers_activated}\nDevices Reached: ${data.transmission_details.estimated_devices_reached}`);
                        } else {
                          alert("Failed to transmit SACHET Broadcast.");
                        }
                      }}
                    >
                      <span>📡</span> Transmit to SACHET Cell Broadcast
                    </button>
                  </div>
                  {showCap && (
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 16, overflow: "auto" }}>
                      <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--teal-bright)", whiteSpace: "pre-wrap", margin: 0 }}>
                        {selected.capXml}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              Select an alert to view details
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
