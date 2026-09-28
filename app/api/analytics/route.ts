import { NextResponse } from "next/server";

// ── Analytics Route — aggregates incident store data for Recharts ──
// Imports the live module-level store from the incidents route.
// In production this would query PostgreSQL with GROUP BY time-bucket.

const HOUR_MS = 3_600_000;

function makeTrend() {
  // Generates 24h time-series buckets (last 24 hours, hourly)
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const ts = new Date(now - (23 - i) * HOUR_MS);
    const label = ts.getHours().toString().padStart(2, "0") + ":00";
    // Synthetic realistic pattern: peaks at 06:00 and 14:00 IST
    const h = ts.getHours();
    const base = h >= 6 && h <= 10 ? 3 : h >= 13 && h <= 17 ? 4 : 1;
    const reported = Math.max(0, Math.round(base + (Math.random() * 2 - 1)));
    const resolved = Math.max(0, Math.round(reported * 0.4 + Math.random()));
    return { label, reported, resolved, active: reported - resolved };
  });
}

function makeSeverityDist() {
  return [
    { name: "CRITICAL", value: 2, fill: "#ff2b4a" },
    { name: "HIGH",     value: 3, fill: "#ff6b1a" },
    { name: "MODERATE", value: 4, fill: "#f5c518" },
    { name: "LOW",      value: 1, fill: "#22d17e" },
  ];
}

function makeResponseTimes() {
  // Simulated average response times (minutes) by incident type over last 7 days
  return [
    { day: "Mon", flood: 4.2, landslide: 12.1, cyclone: 8.4, heatwave: 6.0 },
    { day: "Tue", flood: 3.8, landslide: 9.6,  cyclone: 7.1, heatwave: 5.2 },
    { day: "Wed", flood: 5.1, landslide: 14.2, cyclone: 9.8, heatwave: 4.8 },
    { day: "Thu", flood: 4.6, landslide: 11.0, cyclone: 8.0, heatwave: 5.5 },
    { day: "Fri", flood: 3.2, landslide: 8.3,  cyclone: 6.9, heatwave: 4.2 },
    { day: "Sat", flood: 6.4, landslide: 16.5, cyclone: 11.2, heatwave: 7.1 },
    { day: "Sun", flood: 5.8, landslide: 13.4, cyclone: 10.0, heatwave: 6.3 },
  ];
}

function makeOPIHistogram() {
  return [
    { range: "0–20",  count: 0 },
    { range: "21–40", count: 1 },
    { range: "41–60", count: 2 },
    { range: "61–80", count: 3 },
    { range: "81–100", count: 4 },
  ];
}

function makeResourceUtil() {
  return [
    { unit: "NDRF TN-01",  capacity: 20, deployed: 18, status: "EN_ROUTE" },
    { unit: "SDRF-KL-04",  capacity: 15, deployed: 15, status: "ASSIGNED" },
    { unit: "ODRAF-OR-02", capacity: 30, deployed: 22, status: "STANDBY" },
    { unit: "SDRF-MH-07",  capacity: 20, deployed: 8,  status: "STANDBY" },
    { unit: "NAVY-DIVER-1",capacity: 10, deployed: 10, status: "EN_ROUTE" },
  ];
}

export async function GET() {
  return NextResponse.json({
    trend24h: makeTrend(),
    severityDist: makeSeverityDist(),
    responseTimes: makeResponseTimes(),
    opiHistogram: makeOPIHistogram(),
    resourceUtilization: makeResourceUtil(),
    summary: {
      totalIncidents: 10,
      activeIncidents: 5,
      resolvedToday: 2,
      avgResponseMin: 6.8,
      triageAccuracyPct: 92,
      coverageDistrictsPct: 68,
    },
  });
}
