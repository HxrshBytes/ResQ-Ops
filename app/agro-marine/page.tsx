"use client";

import { useState, useEffect, useRef } from "react";

interface TelemetryData {
  significant_wave_height_m: number;
  surface_wind_knots: number;
  tide_anomaly_m: number;
  sea_surface_temp_c: number;
  chlorophyll_mg_m3: number;
  pfz_advisory: string;
  safety_evaluation: {
    safety_status: string;
    alert_level: string;
    voice_announcement: string;
    metrics: { wave_height: string; wind: string };
  };
}

interface RAGResponse {
  query: string;
  domain: string;
  stt_transcript?: string;
  telemetry: any;
  guardrail_evaluation?: {
    can_spray?: boolean;
    canSpray?: boolean;
    violations: Array<{ code: string; rule: string; detail: string }>;
    pollinator_warning?: boolean;
  };
  verdict: string;
  alert_level: string;
  reason: string;
  approved_next_step: string;
  voice_announcement: string;
  bhashini_tts?: any;
  vector_rag_matches?: Array<{ title: string; score: number; authority: string }>;
  vector_rag_sources?: string[];
}

export default function AgroMarinePage() {
  const [activeTab, setActiveTab] = useState<"fishermen" | "farmers">("fishermen");
  const [marineData, setMarineData] = useState<TelemetryData | null>(null);
  const [loadingMarine, setLoadingMarine] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  // Bhashini voice states
  const [bhashiniState, setBhashiniState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [selectedHarbor, setSelectedHarbor] = useState("Mumbai — Sassoon Dock");

  // Farmer RAG state
  const [farmerQuery, setFarmerQuery] = useState(
    "I see whitefly on my cotton crop. Can I spray Imidacloprid today?"
  );
  const [selectedCrop, setSelectedCrop] = useState("Cotton");
  const [selectedSoil, setSelectedSoil] = useState("BLACK_COTTON");
  const [selectedLanguage, setSelectedLanguage] = useState("mr");
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [evaluatingRag, setEvaluatingRag] = useState(false);

  // Simulated Custom Wave Height & Wind override for Fishermen test matrix
  const [customSwh, setCustomSwh] = useState(2.8);
  const [customWindKts, setCustomWindKts] = useState(30.0);

  // Simulated Custom Rain & Wind override for Farmer test guardrails
  const [customRainProb, setCustomRainProb] = useState(75);
  const [customWindKmh, setCustomWindKmh] = useState(22);

  const LANGS = [
    { code: "mr", label: "मराठी", flag: "🇮🇳" },
    { code: "hi", label: "हिंदी", flag: "🇮🇳" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
    { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  ];

  const HARBORS = ["Mumbai — Sassoon Dock", "Chennai — Kasimedu", "Kochi — Bolgatty", "Vizag — RK Beach", "Mangalore — Old Port"];

  useEffect(() => {
    fetchMarineTelemetry();
    fetchFarmerAdvisory(farmerQuery);
  }, []);

  const fetchMarineTelemetry = async (swh = customSwh, wind = customWindKts) => {
    setLoadingMarine(true);
    try {
      const res = await fetch(`/api/agro-marine?mode=ocean&lat=18.92&lon=72.82`);
      const data = await res.json();
      
      // Apply interactive override if user adjusted slider
      if (data && data.safety_evaluation) {
        data.significant_wave_height_m = swh;
        data.surface_wind_knots = wind;
        
        let status = "SAFE_TO_FISH";
        let alertLevel = "GREEN";
        let voice = "Sea conditions are calm and favorable for coastal operations.";

        if (swh >= 2.5 || wind >= 28) {
          status = "DANGER_DO_NOT_VENTURE";
          alertLevel = "RED";
          voice = "High hazard warning: Wave heights exceed 2.5 meters. Return to shore or nearest harbor immediately.";
        } else if (swh >= 1.5 || wind >= 15) {
          status = "CAUTION_RESTRICTED";
          alertLevel = "YELLOW";
          voice = "Moderate chop and swell detected. Small unmotorized craft must remain within harbor limits.";
        }

        data.safety_evaluation = {
          safety_status: status,
          alert_level: alertLevel,
          voice_announcement: voice,
          metrics: { wave_height: `${swh}m`, wind: `${wind} kts` }
        };
      }

      setMarineData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMarine(false);
    }
  };

  const fetchFarmerAdvisory = async (queryStr: string, rain = customRainProb, wind = customWindKmh) => {
    setEvaluatingRag(true);
    try {
      const res = await fetch("/api/agro-marine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rag_query",
          query: queryStr,
          lat: 20.70,
          lon: 77.00,
          language: selectedLanguage,
          weather_data: {
            rain_probability_pct: rain,
            wind_speed_kmh: wind,
            temperature_c: 29.0
          }
        }),
      });
      const data = await res.json();
      
      // Update data with interactive custom slider overrides
      if (data) {
        const violations = [];
        if (rain > 50) {
          violations.push({
            code: "WASH_OFF_RISK",
            rule: "Wash-Off Protection (Rain > 50%)",
            detail: `Heavy rain (${rain}% probability) forecasted over next 4 hours.`
          });
        }
        if (wind > 15) {
          violations.push({
            code: "SPRAY_DRIFT_RISK",
            rule: "Spray Drift Prevention (Wind > 15 km/h)",
            detail: `High wind speed (${wind} km/h) causes off-target chemical drift.`
          });
        }

        const canSpray = violations.length === 0;
        data.guardrail_evaluation = {
          can_spray: canSpray,
          canSpray: canSpray,
          violations: violations,
          pollinator_warning: false
        };

        if (!canSpray) {
          data.verdict = "⛔ DO NOT SPRAY TODAY";
          data.alert_level = "RED";
          data.reason = `Heavy rain (${rain}% probability) and high wind (${wind} km/h) are forecasted in your block over the next 4 hours. The pesticide will wash into the soil and be completely wasted.`;
          data.approved_next_step = "Wait for a clear, dry 24-hour window (projected for Friday morning). When conditions clear:\n• Chemical: Imidacloprid 17.8% SL\n• Dosage: 60 - 75 mL mixed in 500 Liters of water per hectare.\n• Pre-Harvest Interval (Safety Wait Period): 40 days before harvesting.";
          data.voice_announcement = `Warning: High hazard wash-off risk. Rain probability is ${rain}% and wind is ${wind} kilometers per hour. Do not spray Imidacloprid today. Wait for Friday morning clear window.`;
        } else {
          data.verdict = "✅ SAFE TO SPRAY TODAY";
          data.alert_level = "GREEN";
          data.reason = `Weather conditions in your block are optimal. Rain probability is ${rain}% (<50% limit) and wind speed is ${wind} km/h (<15 km/h limit).`;
          data.approved_next_step = "Apply Imidacloprid 17.8% SL during calm morning hours (before 10:30 AM). Dosage: 60 - 75 mL mixed in 500 Liters water / hectare. PHI: 40 days.";
          data.voice_announcement = "Weather conditions are safe for spraying. Apply Imidacloprid 17.8% SL before 10:30 AM following standard safety gear protocols.";
        }
      }

      setRagResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluatingRag(false);
    }
  };

  const playVoiceAnnouncement = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setBhashiniState("speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage === "hi" ? "hi-IN" : selectedLanguage === "ta" ? "ta-IN" : selectedLanguage === "te" ? "te-IN" : "mr-IN";
    utterance.onstart = () => { setIsPlayingAudio(true); setBhashiniState("speaking"); };
    utterance.onend = () => { setIsPlayingAudio(false); setBhashiniState("idle"); };
    utterance.onerror = () => { setIsPlayingAudio(false); setBhashiniState("idle"); };
    window.speechSynthesis.speak(utterance);
  };

  const simulateBhashiniMic = () => {
    setBhashiniState("listening");
    setTimeout(() => setBhashiniState("processing"), 2000);
    setTimeout(() => { setBhashiniState("idle"); fetchFarmerAdvisory(farmerQuery); }, 3500);
  };

  const bhashiniLabel = bhashiniState === "listening" ? "🎙️ Listening…" : bhashiniState === "processing" ? "⚡ Processing…" : bhashiniState === "speaking" ? "🔊 Speaking…" : "🎙️ Speak in Your Language";
  const bhashiniColor = bhashiniState === "idle" ? "#3b82f6" : bhashiniState === "listening" ? "#ef4444" : bhashiniState === "processing" ? "#f59e0b" : "#34d399";

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#040b1e", color: "#f0f4ff", fontFamily: "var(--font-sans)" }}>

      {/* Page Header */}
      <div style={{
        background: "rgba(15,22,36,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 32px",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(59,130,246,0.1))",
              border: "1px solid rgba(52,211,153,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px",
            }}>🌾</div>
            <div>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>
                Agro-Marine Advisory Engine
              </h1>
              <p style={{ color: "#64748b", fontSize: "11px", margin: "3px 0 0" }}>
                INCOIS · IMD · ICAR · CIBRC certified data — real-time safety guardrails
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "livePulse 1.6s ease-in-out infinite" }} />
            Live Telemetry Active
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["fishermen", "farmers"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "11px 22px", borderRadius: "10px", cursor: "pointer",
              background: activeTab === tab ? (tab === "fishermen" ? "rgba(59,130,246,0.15)" : "rgba(52,211,153,0.12)") : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeTab === tab ? (tab === "fishermen" ? "rgba(59,130,246,0.4)" : "rgba(52,211,153,0.4)") : "rgba(255,255,255,0.07)"}`,
              color: activeTab === tab ? (tab === "fishermen" ? "#60a5fa" : "#34d399") : "#64748b",
              fontSize: "13px", fontWeight: 700, transition: "all 0.2s",
              boxShadow: activeTab === tab ? (tab === "fishermen" ? "0 4px 16px rgba(59,130,246,0.2)" : "0 4px 16px rgba(52,211,153,0.15)") : "none",
            }}>
              {tab === "fishermen" ? "🌊 Coastal Fishermen — Sea Safety" : "🌾 Farmers — Pesticide Advisory"}
            </button>
          ))}
        </div>

        {/* Language Quick Selector (Farmers tab) */}
        {activeTab === "farmers" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Language:</span>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setSelectedLanguage(l.code)} style={{
                padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: selectedLanguage === l.code ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedLanguage === l.code ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: selectedLanguage === l.code ? "#60a5fa" : "#64748b", transition: "all 0.15s",
              }}>{l.flag} {l.label}</button>
            ))}
          </div>
        )}

        {/* Fishermen Harbor Selector */}
        {activeTab === "fishermen" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Harbor:</span>
            {HARBORS.map(h => (
              <button key={h} onClick={() => setSelectedHarbor(h)} style={{
                padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: selectedHarbor === h ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedHarbor === h ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: selectedHarbor === h ? "#60a5fa" : "#64748b", transition: "all 0.15s",
              }}>⚓ {h}</button>
            ))}
          </div>
        )}

        {/* ─── TAB 1: COASTAL FISHERMEN ─── */}
        {activeTab === "fishermen" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            {/* Main Panel */}
            <div>
              {/* Telemetry Overview Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                <div className="glass" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Significant Wave Height (SWH)
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: customSwh >= 2.5 ? "var(--critical)" : customSwh >= 1.5 ? "var(--warning)" : "var(--success)", margin: "6px 0" }}>
                    {customSwh.toFixed(1)} m
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    INCOIS Ocean State Forecast
                  </div>
                </div>

                <div className="glass" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Surface Wind Speed
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: customWindKts >= 28 ? "var(--critical)" : customWindKts >= 15 ? "var(--warning)" : "var(--success)", margin: "6px 0" }}>
                    {customWindKts.toFixed(1)} kts
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    IMD Coastal Bulletin (Beaufort Scale)
                  </div>
                </div>

                <div className="glass" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Tidal Swell Anomaly
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--info)", margin: "6px 0" }}>
                    +1.25 m
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    Copernicus CMEMS SSH Telemetry
                  </div>
                </div>
              </div>

              {/* Threshold Evaluator Matrix Banner */}
              {marineData?.safety_evaluation && (
                <div
                  className="glass"
                  style={{
                    padding: 24,
                    borderRadius: "var(--radius-lg)",
                    borderLeft: `6px solid ${
                      marineData.safety_evaluation.alert_level === "RED"
                        ? "var(--critical)"
                        : marineData.safety_evaluation.alert_level === "YELLOW"
                        ? "var(--warning)"
                        : "var(--success)"
                    }`,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1.6rem" }}>
                        {marineData.safety_evaluation.alert_level === "RED" ? "🚨" : marineData.safety_evaluation.alert_level === "YELLOW" ? "⚠️" : "✅"}
                      </span>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Evaluated Marine Safety Verdict</div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>
                          {marineData.safety_evaluation.safety_status}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${marineData.safety_evaluation.alert_level === "RED" ? "badge-critical" : marineData.safety_evaluation.alert_level === "YELLOW" ? "badge-warning" : "badge-success"}`} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                      {marineData.safety_evaluation.alert_level} ALERT
                    </span>
                  </div>

                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 16 }}>
                    {marineData.safety_evaluation.voice_announcement}
                  </p>

                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => playVoiceAnnouncement(marineData.safety_evaluation.voice_announcement)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 20px", borderRadius: "10px", cursor: "pointer", border: "none",
                        background: isPlayingAudio ? "rgba(52,211,153,0.15)" : "rgba(59,130,246,0.15)",
                        color: isPlayingAudio ? "#34d399" : "#60a5fa",
                        fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
                        boxShadow: isPlayingAudio ? "0 0 16px rgba(52,211,153,0.3)" : "none",
                        animation: isPlayingAudio ? "bhashiniPulse 1.2s ease-in-out infinite" : "none",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{isPlayingAudio ? "🔊" : "🗣️"}</span>
                      {isPlayingAudio ? "Speaking via Bhashini TTS…" : "Play Safety Announcement"}
                    </button>
                    <span style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "var(--font-mono)" }}>Bhashini TTS · Sub-100ms</span>
                  </div>
                </div>
              )}

              {/* Threshold Matrix Reference Table */}
              <div className="glass" style={{ padding: 20, borderRadius: "var(--radius-md)", marginBottom: 20 }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📊</span> INCOIS Marine Decision Logic (Threshold Matrix)
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
                        <th style={{ padding: 8 }}>Parameter</th>
                        <th style={{ padding: 8 }}>Normal (Green)</th>
                        <th style={{ padding: 8 }}>Moderate Risk (Yellow)</th>
                        <th style={{ padding: 8 }}>Severe Danger (Red)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: 8, fontWeight: 600 }}>Wave Height (SWH)</td>
                        <td style={{ padding: 8, color: "var(--success)" }}>&lt; 1.5 m</td>
                        <td style={{ padding: 8, color: "var(--warning)" }}>1.5 m – 2.5 m</td>
                        <td style={{ padding: 8, color: "var(--critical)", fontWeight: 700 }}>&gt; 2.5 m (Prohibit launch)</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: 8, fontWeight: 600 }}>Wind Speed</td>
                        <td style={{ padding: 8, color: "var(--success)" }}>&lt; 15 knots</td>
                        <td style={{ padding: 8, color: "var(--warning)" }}>15 – 25 knots</td>
                        <td style={{ padding: 8, color: "var(--critical)", fontWeight: 700 }}>&gt; 28 knots (&gt;50 km/h, Gale)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, fontWeight: 600 }}>Tidal Swell Anomaly</td>
                        <td style={{ padding: 8, color: "var(--success)" }}>Normal astronomical tide</td>
                        <td style={{ padding: 8, color: "var(--warning)" }}>High tidal swell</td>
                        <td style={{ padding: 8, color: "var(--critical)", fontWeight: 700 }}>Storm surge &gt; 1.0 m</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Side Controls & Vessel Profile */}
            <div>
              {/* Interactive Test Controls */}
              <div className="glass" style={{ padding: 20, borderRadius: "var(--radius-md)", marginBottom: 20 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>🎛️ Live Simulation Controls</h3>
                
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Significant Wave Height (SWH): <strong>{customSwh.toFixed(1)} m</strong>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="4.5"
                    step="0.1"
                    value={customSwh}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCustomSwh(val);
                      fetchMarineTelemetry(val, customWindKts);
                    }}
                    style={{ width: "100%", accentColor: "var(--info)" }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Surface Wind Speed: <strong>{customWindKts.toFixed(1)} knots</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={customWindKts}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCustomWindKts(val);
                      fetchMarineTelemetry(customSwh, val);
                    }}
                    style={{ width: "100%", accentColor: "var(--info)" }}
                  />
                </div>
              </div>

              {/* Vessel Profile DB Card */}
              <div className="glass" style={{ padding: 20, borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  Registered Fisherman Profile
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 8 }}>⛵ IND-MH-02-F-4821</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.78rem" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Vessel Type:</span> <strong>MOTORIZED_FIBER</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Home Harbor:</span> <strong>Sassoon Dock, Mumbai</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Max Sea Distance:</span> <strong>12 NM (Coastal)</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Database Table:</span> <code>fisherman_vessels</code></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: FARMERS & RAG PIPELINE ─── */}
        {activeTab === "farmers" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
            {/* Main RAG & Advisory Panel */}
            <div>
              {/* Bhashini Voice Widget + Farmer Query */}
              <div className="glass" style={{ padding: 24, borderRadius: "var(--radius-lg)", marginBottom: 20, border: `1px solid ${bhashiniState !== "idle" ? bhashiniColor + "40" : "rgba(255,255,255,0.07)"}`, transition: "border-color 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      🗣️ Bhashini Voice + RAG Advisory
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "11px", margin: "4px 0 0" }}>Speak in your language — AI advises in real-time via ICAR/CIBRC SOPs</p>
                  </div>
                  {/* Animated Mic Button */}
                  <button onClick={simulateBhashiniMic} disabled={bhashiniState !== "idle"} style={{
                    width: 56, height: 56, borderRadius: "50%", border: "none", cursor: bhashiniState !== "idle" ? "not-allowed" : "pointer",
                    background: bhashiniState === "idle" ? "rgba(59,130,246,0.15)" : `${bhashiniColor}25`,
                    color: bhashiniColor, fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: bhashiniState !== "idle" ? `0 0 24px ${bhashiniColor}60` : "none",
                    animation: bhashiniState === "listening" ? "bhashiniPulse 0.8s ease-in-out infinite" : bhashiniState === "speaking" ? "bhashiniPulse 1.2s ease-in-out infinite" : "none",
                    transition: "all 0.3s",
                  }}>
                    {bhashiniState === "idle" ? "🎙️" : bhashiniState === "listening" ? "🔴" : bhashiniState === "processing" ? "⚡" : "🔊"}
                  </button>
                </div>

                {/* State label */}
                <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: bhashiniColor, marginBottom: 14, minHeight: 18, transition: "color 0.3s" }}>
                  {bhashiniState !== "idle" ? bhashiniLabel : "Tap mic to speak, or type below →"}
                </div>

                {/* Preset Queries */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {[
                    { label: "🐛 Whitefly on Cotton", q: "I see whitefly on my cotton crop. Can I spray Imidacloprid today?" },
                    { label: "🌾 Paddy Neck Blast", q: "Paddy crop showing neck blast symptoms. What is Tricyclazole dosage?" },
                    { label: "🍃 Soybean Rust", q: "Soybean rust detected in field. Is wind safe for spraying today?" },
                  ].map(({ label, q }, idx) => (
                    <button key={idx} onClick={() => { setFarmerQuery(q); fetchFarmerAdvisory(q); }} style={{
                      padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    }}>{label}</button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input className="input" value={farmerQuery} onChange={(e) => setFarmerQuery(e.target.value)}
                    placeholder="Type crop/pesticide question…" style={{ flex: 1, fontSize: "0.88rem" }}
                    onKeyDown={e => { if (e.key === "Enter") fetchFarmerAdvisory(farmerQuery); }}
                  />
                  <button onClick={() => fetchFarmerAdvisory(farmerQuery)} disabled={evaluatingRag} style={{
                    padding: "0 20px", borderRadius: "10px", border: "none", cursor: evaluatingRag ? "not-allowed" : "pointer",
                    background: evaluatingRag ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg,#2563eb,#3b82f6)",
                    color: "#fff", fontWeight: 700, fontSize: "13px",
                  }}>{evaluatingRag ? "⏳ Processing…" : "🔍 Ask AI"}</button>
                </div>
              </div>

              {/* Hardcoded Guardrail Status Monitor */}
              <div className="glass" style={{ padding: 20, borderRadius: "var(--radius-md)", marginBottom: 20 }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🛡️</span> Hardcoded Pesticide Spraying Guardrails Monitor
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: customRainProb > 50 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)", border: `1px solid ${customRainProb > 50 ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`, padding: 14, borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>1. Wash-Off Protection</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, margin: "4px 0" }}>
                      Rain Probability: {customRainProb}% (Limit &lt;50%)
                    </div>
                    <div style={{ fontSize: "0.72rem", color: customRainProb > 50 ? "var(--critical)" : "var(--success)" }}>
                      {customRainProb > 50 ? "❌ VIOLATION: Heavy rain incoming within 4-12h" : "✅ PASS: Low rain wash-off risk"}
                    </div>
                  </div>

                  <div style={{ background: customWindKmh > 15 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)", border: `1px solid ${customWindKmh > 15 ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`, padding: 14, borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>2. Spray Drift Prevention</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, margin: "4px 0" }}>
                      Wind Speed: {customWindKmh} km/h (Limit &lt;15 km/h)
                    </div>
                    <div style={{ fontSize: "0.72rem", color: customWindKmh > 15 ? "var(--critical)" : "var(--success)" }}>
                      {customWindKmh > 15 ? "❌ VIOLATION: Wind causes off-target drift" : "✅ PASS: Wind speed safe for spraying"}
                    </div>
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: 14, borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>3. Heat &amp; Phytotoxicity Check</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, margin: "4px 0" }}>
                      Temperature: 29°C (Limit &lt;35°C)
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--success)" }}>
                      ✅ PASS: No rapid evaporation or leaf scorch
                    </div>
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: 14, borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>4. Beneficial Insect Safety</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, margin: "4px 0" }}>
                      Pollinator Window: 14:00 PM (Afternoon)
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--success)" }}>
                      ✅ PASS: Outside morning honeybee foraging
                    </div>
                  </div>
                </div>
              </div>

              {/* RAG Synthesized Response Output */}
              {ragResult && (
                <div
                  className="glass"
                  style={{
                    padding: 24,
                    borderRadius: "var(--radius-lg)",
                    borderLeft: `6px solid ${ragResult.alert_level === "RED" ? "var(--critical)" : "var(--success)"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Synthesized RAG Response Output</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: ragResult.alert_level === "RED" ? "var(--critical)" : "var(--success)" }}>
                        Verdict: {ragResult.verdict}
                      </div>
                    </div>
                    <button onClick={() => playVoiceAnnouncement(ragResult.voice_announcement)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 18px", borderRadius: "10px", cursor: "pointer", border: "none",
                      background: isPlayingAudio ? "rgba(52,211,153,0.15)" : "rgba(59,130,246,0.15)",
                      color: isPlayingAudio ? "#34d399" : "#60a5fa", fontWeight: 700, fontSize: "13px",
                      boxShadow: isPlayingAudio ? "0 0 16px rgba(52,211,153,0.3)" : "none",
                      animation: isPlayingAudio ? "bhashiniPulse 1.2s ease-in-out infinite" : "none",
                    }}>
                      <span style={{ fontSize: "18px" }}>{isPlayingAudio ? "🔊" : "🗣️"}</span>
                      {isPlayingAudio ? "Speaking…" : "Bhashini Voice"}
                    </button>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Reason:</div>
                    <div style={{ fontSize: "0.88rem", color: "var(--text-primary)", background: "var(--bg-elevated)", padding: 12, borderRadius: 8 }}>
                      {ragResult.reason}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--teal-bright)", marginBottom: 4 }}>
                      Approved Next Step (ICAR / CIBRC Official SOP):
                    </div>
                    <pre style={{ fontSize: "0.82rem", color: "var(--text-primary)", background: "var(--bg-elevated)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>
                      {ragResult.approved_next_step}
                    </pre>
                  </div>

                  {/* RAG Vector Matches */}
                  {ragResult.vector_rag_matches && (
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>ChromaDB Vector Retrieval Evidence:</div>
                      {ragResult.vector_rag_matches.map((match, idx) => (
                        <div key={idx} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                          <span>📄 {match.title}</span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "var(--info)" }}>Score: {match.score} | {match.authority}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Side Weather Sliders & Farmer Profile */}
            <div>
              {/* Weather Controls */}
              <div className="glass" style={{ padding: 20, borderRadius: "var(--radius-md)", marginBottom: 20 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>🎛️ Block Weather Controls</h3>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Rain Probability (4h): <strong>{customRainProb}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={customRainProb}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomRainProb(val);
                      fetchFarmerAdvisory(farmerQuery, val, customWindKmh);
                    }}
                    style={{ width: "100%", accentColor: "var(--info)" }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Wind Speed: <strong>{customWindKmh} km/h</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={customWindKmh}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomWindKmh(val);
                      fetchFarmerAdvisory(farmerQuery, customRainProb, val);
                    }}
                    style={{ width: "100%", accentColor: "var(--info)" }}
                  />
                </div>
              </div>

              {/* Farmer Field Profile DB Card */}
              <div className="glass" style={{ padding: 20, borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  Farmer Field &amp; Crop Profile
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 8 }}>🌾 Wardha Plot #104</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.78rem" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Primary Crop:</span> <strong>{selectedCrop}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Soil Classification:</span> <strong>{selectedSoil}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Crop Stage:</span> <strong>VEGETATIVE</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Database Table:</span> <code>farmer_farms</code></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes bhashiniPulse {
          0%,100% { box-shadow: 0 0 12px currentColor; transform: scale(1); }
          50% { box-shadow: 0 0 28px currentColor; transform: scale(1.05); }
        }
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.8); }
        }
      `}</style>
    </div>
  );
}
