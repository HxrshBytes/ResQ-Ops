"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Analytics {
  trend24h: Array<{ label: string; reported: number; resolved: number; active: number }>;
  severityDist: Array<{ name: string; value: number; fill: string }>;
  responseTimes: Array<{ day: string; flood: number; landslide: number; cyclone: number; heatwave: number }>;
  opiHistogram: Array<{ range: string; count: number }>;
  resourceUtilization: Array<{ unit: string; capacity: number; deployed: number; status: string }>;
  summary: {
    totalIncidents: number;
    activeIncidents: number;
    resolvedToday: number;
    avgResponseMin: number;
    triageAccuracyPct: number;
    coverageDistrictsPct: number;
  };
}

// Shared tooltip style
const tooltipStyle = {
  backgroundColor: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: "0.78rem",
  fontFamily: "var(--font-mono)",
};

const axisStyle = { fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" };

function KPI({ value, label, sub, color }: { value: string | number; label: string; sub?: string; color: string }) {
  return (
    <div className="glass-surface" style={{ padding: "20px 24px", borderRadius: "var(--radius-lg)", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "var(--font-mono)", color }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-void)", color: "var(--text-muted)" }}>
        Loading analytics…
      </div>
    );
  }

  const { trend24h, severityDist, responseTimes, opiHistogram, resourceUtilization, summary } = data;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)", color: "var(--text-primary)" }}>


      <div style={{ padding: "32px 24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── KPI Row ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Key Performance Indicators — Last 24 Hours
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            <KPI value={summary.totalIncidents} label="Total Incidents" sub="All time today" color="var(--info)" />
            <KPI value={summary.activeIncidents} label="Active Incidents" sub="Pending dispatch" color="var(--high)" />
            <KPI value={summary.resolvedToday} label="Resolved Today" sub="Closed in last 24h" color="var(--low)" />
            <KPI value={`${summary.avgResponseMin}m`} label="Avg Response" sub="SUBMITTED → ASSIGNED" color="var(--teal-bright)" />
            <KPI value={`${summary.triageAccuracyPct}%`} label="Triage Accuracy" sub="True positive rate" color="var(--moderate)" />
            <KPI value={`${summary.coverageDistrictsPct}%`} label="District Coverage" sub="Active monitoring" color="var(--critical)" />
          </div>
        </div>

        {/* ── Row 1: Trend + Severity ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

          {/* 24h Trend */}
          <div className="glass-surface" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              📈 24-Hour Incident Volume Trend
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend24h} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff2b4a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff2b4a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d17e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d17e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,99,180,0.08)" />
                <XAxis dataKey="label" tick={axisStyle} tickLine={false} interval={3} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                <Legend wrapperStyle={{ fontSize: "0.72rem", color: "var(--text-muted)" }} />
                <Area type="monotone" dataKey="reported" stroke="#ff2b4a" strokeWidth={2} fill="url(#gradReported)" name="Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#22d17e" strokeWidth={2} fill="url(#gradResolved)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Donut */}
          <div className="glass-surface" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              🔴 Severity Distribution
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={severityDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {severityDist.map((s) => (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.fill }} />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: s.fill, fontWeight: 700 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Response Times + OPI Histogram ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginBottom: 20 }}>

          {/* Response Times by type */}
          <div className="glass-surface" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              ⏱️ Avg Response Time by Incident Type (minutes) — 7 Days
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={responseTimes} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,99,180,0.08)" />
                <XAxis dataKey="day" tick={axisStyle} tickLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit="m" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "0.72rem" }} />
                <Line type="monotone" dataKey="flood" stroke="#3b9eff" strokeWidth={2} dot={false} name="Flood" />
                <Line type="monotone" dataKey="landslide" stroke="#ff2b4a" strokeWidth={2} dot={false} name="Landslide" />
                <Line type="monotone" dataKey="cyclone" stroke="#ff6b1a" strokeWidth={2} dot={false} name="Cyclone" />
                <Line type="monotone" dataKey="heatwave" stroke="#f5c518" strokeWidth={2} dot={false} name="Heatwave" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* OPI Histogram */}
          <div className="glass-surface" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              📊 OPI Score Distribution
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={opiHistogram} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,99,180,0.08)" vertical={false} />
                <XAxis dataKey="range" tick={axisStyle} tickLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(59,99,180,0.06)" }} />
                <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                  {opiHistogram.map((entry, i) => {
                    const colors = ["#22d17e", "#f5c518", "#f5c518", "#ff6b1a", "#ff2b4a"];
                    return <Cell key={i} fill={colors[i]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row 3: Resource Utilization ── */}
        <div className="glass-surface" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            🚑 Rescue Unit — Resource Utilization
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {resourceUtilization.map((unit) => {
              const pct = Math.round((unit.deployed / unit.capacity) * 100);
              const statusColor = unit.status === "EN_ROUTE" ? "var(--low)" : unit.status === "ASSIGNED" ? "var(--info)" : "var(--text-muted)";
              return (
                <div key={unit.unit} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 120px", gap: 16, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{unit.unit}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Cap: {unit.capacity} pax</div>
                  </div>
                  <div>
                    <div className="risk-bar">
                      <div
                        className={pct >= 90 ? "risk-fill risk-critical" : pct >= 70 ? "risk-fill risk-high" : "risk-fill risk-moderate"}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 3 }}>
                      {unit.deployed}/{unit.capacity} deployed
                    </div>
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: pct >= 90 ? "var(--critical)" : pct >= 70 ? "var(--high)" : "var(--moderate)", textAlign: "right" }}>
                    {pct}%
                  </div>
                  <div style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700,
                    fontFamily: "var(--font-mono)", textTransform: "uppercase",
                    background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40`,
                    textAlign: "center",
                  }}>
                    {unit.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
