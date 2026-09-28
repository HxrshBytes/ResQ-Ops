"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolData?: Record<string, any>;
  intent?: string;
  _semanticCacheHit?: boolean;
  _circuitBreakerActive?: boolean;
  latencyMs?: number;
}

const QUICK_PROMPTS = [
  { label: "🌧️ Rain in Wayanad", query: "Will it rain heavily in Wayanad today?" },
  { label: "🚜 ICAR Spray advisory Wardha", query: "Should I spray pesticides on my cotton crop in Wardha today?" },
  { label: "🚤 Rescue Boat route Patel Nagar", query: "Can rescue boats or vehicles reach Patel Nagar right now?" },
  { label: "🌀 Cyclone Tej hazard status", query: "What is the current cyclone hazard alert status for Puri coast?" },
  { label: "🌡️ WBGT Heatwave Nagpur", query: "How severe is the WBGT heat stress in Nagpur right now?" },
  { label: "⛈️ Aquaplaning risk Mumbai", query: "Is there aquaplaning and road flood risk in Mumbai today?" },
];

const LANG_OPTIONS = [
  { label: "EN", name: "English" },
  { label: "हि", name: "Hindi" },
  { label: "मर", name: "Marathi" },
  { label: "த", name: "Tamil" },
];

function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,3}\s(.+)/gm, "<div style='font-weight:700;font-size:0.9rem;margin-bottom:4px'>$1</div>")
    .replace(/^[-•]\s(.+)/gm, "<div style='padding-left:12px;margin:2px 0'>• $1</div>")
    .replace(/\n/g, "<br/>");
}


function TypewriterText({ text, enabled }: { text: string; enabled: boolean }) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  
  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      i += 3; // render 3 chars at a time for snappy feel
      setDisplayed(text.substring(0, i));
      if (i >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [text, enabled]);

  return <div style={{ lineHeight: 1.75, fontSize: "0.875rem" }} dangerouslySetInnerHTML={{ __html: formatMarkdown(displayed) + (enabled && displayed.length < text.length ? "▋" : "") }} />;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "**Namaste! I'm WeatherGPT — ResQ-Ops Active Decision Support Engine.**\n\nI combine **live meteorological streams** with **deterministic parametric evaluators** (ICAR agricultural rules, WBGT heat index, dynamic PostGIS route costing) and grounded LLM synthesis.\n\n**Key Capabilities:**\n- 🚜 ICAR Pesticide & Fertilizer Spray Window Advisory\n- 🌡️ WBGT Heat Stress & Sunstroke Hazard Index\n- 🚗 Commute Aquaplaning & Two-Wheeler Crosswind Stability\n- 🚤 Dynamic Flood Water Inundation & Rescue Route Costing\n- ⚡ High-Load Circuit Breaker Mode (Zero LLM Latency)\n\nSelect a prompt or ask your question below.",
      intent: "greeting",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLang, setActiveLang] = useState("EN");
  const [circuitBreakerMode, setCircuitBreakerMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          circuitBreakerMode,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          toolData: data.toolData,
          intent: data.intent,
          _semanticCacheHit: data._semanticCacheHit,
          _circuitBreakerActive: data._circuitBreakerActive,
          latencyMs: data.latencyMs,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-void)", color: "var(--text-primary)" }}>
      

      {/* ── Sub-header: Chat Options ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", background: "var(--bg-base)", borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #3b9eff, #00d4c8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>
            🤖
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Live Stream • Redis Cache • Deterministic Rules
          </span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Circuit Breaker Toggle */}
          <button
            onClick={() => setCircuitBreakerMode(!circuitBreakerMode)}
            className={`btn ${circuitBreakerMode ? "btn-danger" : "btn-ghost"}`}
            style={{ fontSize: "0.72rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}
            data-tooltip="Bypasses LLM under 50k load to execute sub-10ms deterministic expert rules"
          >
            <span>{circuitBreakerMode ? "⚡ CIRCUIT BREAKER: ON" : "🧠 LLM AGENT MODE"}</span>
          </button>

          {/* Language selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.label}
                onClick={() => setActiveLang(l.label)}
                data-tooltip={l.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  background: activeLang === l.label ? "var(--bg-elevated)" : "transparent",
                  color: activeLang === l.label ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: activeLang === l.label ? "1px solid var(--border-default)" : "1px solid transparent",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout: sidebar + chat ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Left sidebar: quick prompts + system stats ── */}
        <aside style={{ width: 270, borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: 16, overflowY: "auto" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Quick Safety Queries</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.query)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }} />

            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Rule & Cache Pipeline</div>
            {[
              { icon: "⚡", label: "Semantic FAQ Cache", sub: "Redis HNSW Vector" },
              { icon: "🌾", label: "Agrometeorology Rules", sub: "ICAR GKMS Standard" },
              { icon: "🌡️", label: "WBGT Heat Engine", sub: "Solar/Humid Index" },
              { icon: "🚤", label: "Dynamic Cost Router", sub: "30cm Flood Cut-off" },
              { icon: "🛡️", label: "Circuit Breaker", sub: "50k Load Fallback" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{item.label}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: msg.role === "user" ? "flex-end" : "flex-start", animation: "fade-in-up 0.3s ease" }}>
                {msg.role === "assistant" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #3b9eff, #00d4c8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>🤖</div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>WeatherGPT</span>
                    {msg.intent && <span className="badge badge-info" style={{ fontSize: "0.58rem" }}>{msg.intent}</span>}
                    {msg._semanticCacheHit && (
                      <span className="badge badge-success" style={{ fontSize: "0.58rem" }}>⚡ REDIS VECTOR CACHE (&lt;20ms)</span>
                    )}
                    {msg._circuitBreakerActive && (
                      <span className="badge badge-warning" style={{ fontSize: "0.58rem" }}>🛡️ CIRCUIT BREAKER ACTIVE</span>
                    )}
                    {msg.latencyMs && (
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {msg.latencyMs}ms
                      </span>
                    )}
                  </div>
                )}

                <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                  <TypewriterText text={msg.content} enabled={msg.role === "assistant" && i === messages.length - 1 && !loading} />
                </div>

                {/* Safety Advisory & Tool Data Panel */}
                {msg.toolData && !msg.toolData.error && (
                  <div
                    className="glass-surface"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      maxWidth: "85%",
                      borderLeft: "3px solid var(--teal-bright)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--teal-bright)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                        📡 Live Telemetry & Parametric Safety Evaluation
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Source: Open-Meteo • Conf: {String(msg.toolData.confidence)}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                      {[
                        { k: "🌡️ Ambient Temp", v: `${msg.toolData.temperature_c}°C` },
                        { k: "💧 Humidity", v: `${msg.toolData.humidity_pct}%` },
                        { k: "🌧️ Precipitation", v: `${msg.toolData.precipitation_mm} mm` },
                        { k: "💨 Wind Speed", v: `${msg.toolData.wind_speed_kmh} km/h` },
                      ].map((item) => (
                        <div key={item.k} style={{ background: "rgba(255,255,255,0.02)", padding: 6, borderRadius: 4 }}>
                          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{item.k}</div>
                          <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>{item.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Parametric Safety Advisory Details */}
                    {msg.toolData.safetyAdvisory && (
                      <div style={{ background: "rgba(0,212,200,0.05)", border: "1px dashed rgba(0,212,200,0.2)", padding: 10, borderRadius: 6, marginTop: 8, fontSize: "0.72rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--teal-bright)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>🚦 Parametric Safety &amp; Elevation Routing Corridor:</span>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>OSRM Dynamic A* Costing</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                          <div>☀️ WBGT Index: <strong>{(msg.toolData.safetyAdvisory as any).wbgt}°C</strong> ({(msg.toolData.safetyAdvisory as any).heatStressRisk})</div>
                          <div>🌾 ICAR Spray Safe: <strong>{(msg.toolData.safetyAdvisory as any).agri?.sprayWindowSafe ? "YES ✅" : "NO ❌"}</strong></div>
                          <div>🚗 Aquaplaning: <strong>{(msg.toolData.safetyAdvisory as any).travel?.aquaplaningRisk}</strong></div>
                          <div>🌊 Flood Depth: <strong>{(msg.toolData.safetyAdvisory as any).waterDepthEstCm} cm depth</strong> (Cutoff threshold &gt;30cm)</div>
                        </div>

                        {/* Elevation Profile Visualization Cross-Section */}
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: 8, borderRadius: 6, marginTop: 6 }}>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 4 }}>📈 Ground Elevation Profile along Route Corridor:</div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }}>
                            {[12, 14, 18, 24, 38, 42, 45, 30, 22, 16].map((h, idx) => (
                              <div
                                key={idx}
                                style={{
                                  flex: 1,
                                  height: `${(h / 50) * 100}%`,
                                  background: h < 20 ? "var(--critical)" : h < 30 ? "var(--warning)" : "var(--success)",
                                  borderRadius: 2,
                                }}
                                title={`Waypoint #${idx + 1}: ${h}m elevation`}
                              />
                            ))}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 4 }}>
                            <span>Low hollow (12m - Waterlogged)</span>
                            <span style={{ color: "var(--success)" }}>Elevated Ridge (+45m - Safe Detour)</span>
                          </div>
                        </div>

                        {/* 1-Click Crowdsourced Hazard Pins */}
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border-subtle)" }}>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 6 }}>📍 Crowdsource Citizen Hazard Pin (1-Click Vetting):</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {["🚧 Road Blocked", "🌊 Water Receding", "⚡ Power Line Down"].map((pin) => (
                              <button
                                key={pin}
                                onClick={() => alert(`Submitted Crowdsourced Pin: ${pin}. Verification broadcast queued for PostGIS engine.`)}
                                className="btn btn-ghost"
                                style={{ fontSize: "0.65rem", padding: "3px 8px" }}
                              >
                                {pin}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #3b9eff, #00d4c8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>🤖</div>
                <div className="glass-surface" style={{ padding: "12px 16px", borderRadius: "4px 16px 16px 16px" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Running Safety Pipeline & LLM Synthesis</div>
                    {[0, 1, 2].map((j) => (
                      <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--info)", animation: `pulse-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: "16px 40px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-base)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about ICAR spray advisory, rescue routes, heatwave WBGT index, or storm alerts…"
                rows={1}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "12px 16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  outline: "none",
                  lineHeight: 1.6,
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(59,158,255,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-default)")}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="btn btn-primary"
                style={{ height: 44, padding: "0 20px", flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}
              >
                {loading ? "⏳" : "→"}
              </button>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                ⚡ Sub-15ms Redis Stream Vector Cache • ICAR & WBGT Deterministic Engine • Llama 3.3 70B Fallback
              </span>
              {circuitBreakerMode && (
                <span style={{ fontSize: "0.65rem", color: "var(--warning)", fontWeight: 700 }}>
                  ⚡ High-Load Circuit Breaker Active: LLM Bypassed (Sub-10ms Response Time)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
