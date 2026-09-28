"use client";
import Link from "next/link";
import { Shield, Bot, Monitor, AlertTriangle, Lock, Key, Send, Zap, Radio } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [query, setQuery] = useState("");

  const stats = [
    { value: "< 2s", label: "Alert Dispatch Time",   accent: false },
    { value: "92%",  label: "Triage Accuracy",        accent: true  },
    { value: "8",    label: "Indian Languages",        accent: false },
    { value: "24/7", label: "Autonomous Monitoring",   accent: false },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#040b1e",
      color: "#f0f4ff",
      fontFamily: "var(--font-sans)",
      overflowX: "hidden",
      position: "relative",
    }}>

      {/* ══════════════════════════════════════════════
          ATMOSPHERIC BACKGROUND
      ══════════════════════════════════════════════ */}

      {/* Deep radial glow — top right (green tint for ops feel) */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 60% at 80% 10%, rgba(30,58,138,0.28) 0%, transparent 60%),
          radial-gradient(ellipse 55% 45% at 10% 80%, rgba(49,16,110,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 100% 100% at 50% 50%, #050d22 40%, #040b1e 100%)
        `,
      }} />

      {/* Subtle dot-matrix pattern */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(rgba(59,130,246,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />

      {/* Radar rings — top right corner decoration */}
      <div style={{
        position: "fixed", top: "-200px", right: "-200px",
        width: "700px", height: "700px",
        borderRadius: "50%",
        border: "1px solid rgba(59,130,246,0.06)",
        pointerEvents: "none", zIndex: 0,
        boxShadow: `
          inset 0 0 0 150px transparent,
          0 0 0 120px rgba(59,130,246,0.03),
          0 0 0 280px rgba(59,130,246,0.02),
          0 0 0 420px rgba(59,130,246,0.01)
        `,
      }} />

      {/* ══════════════════════════════════════════════
          TOP ALERT BANNER
      ══════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 50,
        background: "rgba(25,6,6,0.95)",
        borderBottom: "1px solid rgba(239,68,68,0.2)",
        padding: "6px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Pulsing Dot */}
          <span className="live-dot" />
          <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Critical Alert:
          </span>
          <span style={{ color: "#fca5a5", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Urban Flood — Mumbai Andheri (3 SOS Verified)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#60a5fa", fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em" }}>
          <Radio size={11} />
          System Live · Sec-Ops Secured
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          NAVBAR — Logo LEFT · Links CENTER · Buttons RIGHT
      ══════════════════════════════════════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: "rgba(8,12,20,0.82)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Full-width — no centering — logo must be at the true left edge */}
        <div style={{
          width: "100%",
          padding: "0 24px",
          height: "60px",
          display: "flex", alignItems: "center",
          boxSizing: "border-box",
        }}>

          {/* ── LEFT: Logo ─────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "9px", flexShrink: 0, width: "180px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
              <img src="/logo.jpg" alt="ResQ-Ops" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              <span style={{ color: "#ef4444" }}>resQ</span>
              <span style={{ color: "#f0f4ff" }}>-ops</span>
            </span>
          </div>

          {/* ── CENTER: Nav Links ──────────────── */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "28px" }}>
            {["Features", "Architecture", "Command Center", "Analytics"].map((item) => (
              <Link key={item} href="#"
                style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#60a5fa")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
              >{item}</Link>
            ))}
          </div>

          {/* ── RIGHT: Action Buttons ──────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, width: "auto", justifyContent: "flex-end" }}>

            {/* Report SOS */}
            <Link href="/citizen" style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "7px 14px",
              background: "#dc2626", color: "#fff",
              borderRadius: "7px", fontSize: "11px", fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 0 16px rgba(220,38,38,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#ef4444"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(239,68,68,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#dc2626"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(220,38,38,0.35)"; }}
            >
              <AlertTriangle size={11} /> Report SOS
            </Link>

            {/* Citizen Privacy */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "6px 11px",
              background: "rgba(96,165,250,0.10)", color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.28)",
              borderRadius: "7px", fontSize: "10px", fontWeight: 600,
              whiteSpace: "nowrap", cursor: "default",
            }}>
              <Lock size={10} /> Citizen Privacy Active
            </div>

            {/* Agency Login */}
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "6px 11px",
              background: "rgba(100,116,139,0.1)", color: "#94a3b8",
              border: "1px solid rgba(100,116,139,0.2)",
              borderRadius: "7px", fontSize: "10px", fontWeight: 600,
              textDecoration: "none", whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#60a5fa"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,116,139,0.2)"; }}
            >
              <Key size={10} /> Agency Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          HERO — CENTERED
      ══════════════════════════════════════════════ */}
      <main style={{
        position: "relative", zIndex: 10,
        maxWidth: "900px", margin: "0 auto",
        padding: "72px 32px 160px",
        textAlign: "center",
      }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          padding: "5px 16px",
          background: "rgba(59,130,246,0.07)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "999px",
          color: "#60a5fa", fontSize: "9.5px", fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
          marginBottom: "36px",
          boxShadow: "0 0 20px rgba(59,130,246,0.08)",
        }}>
          <Shield size={10} />
          ResQ-Ops — AI-Augmented Emergency Operations Center
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: "clamp(3rem, 7.5vw, 5.8rem)",
          fontWeight: 900, lineHeight: 1.04,
          letterSpacing: "-0.04em",
          color: "#ffffff",
          marginBottom: "6px",
        }}>
          AI That Saves Lives
        </h1>

        {/* H2 gradient */}
        <h2 style={{
          fontSize: "clamp(3rem, 7.5vw, 5.8rem)",
          fontWeight: 900, lineHeight: 1.08,
          letterSpacing: "-0.04em",
          background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "30px",
          filter: "drop-shadow(0 0 32px rgba(96,165,250,0.4))",
        }}>
          Not Just Predicts Weather
        </h2>

        {/* Description */}
        <p style={{
          maxWidth: "600px", margin: "0 auto 44px",
          fontSize: "1rem", lineHeight: 1.75,
          color: "#64748b", fontWeight: 400,
        }}>
          ResQ-Ops unifies weather intelligence, geospatial routing, distress
          verification, and human-in-the-loop dispatch into one mission-critical
          platform for India's disaster responders.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "56px" }}>
          <Link href="/chat" style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "12px 26px",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#ffffff",
            borderRadius: "10px", fontWeight: 700, fontSize: "13.5px",
            textDecoration: "none",
            boxShadow: "0 4px 24px rgba(59,130,246,0.45)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1d4ed8, #2563eb)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(59,130,246,0.6)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #2563eb, #3b82f6)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(59,130,246,0.45)"; }}
          >
            <Bot size={16} /> Try WeatherGPT Chat
          </Link>

          <Link href="/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "11px 26px",
            background: "transparent", color: "#cbd5e1",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "10px", fontWeight: 600, fontSize: "13.5px",
            textDecoration: "none", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.5)"; (e.currentTarget as HTMLElement).style.color = "#60a5fa"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color = "#cbd5e1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <Monitor size={16} /> Command Dashboard
          </Link>

          <Link href="/citizen" style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "11px 26px",
            background: "rgba(239,68,68,0.08)", color: "#f87171",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px", fontWeight: 600, fontSize: "13.5px",
            textDecoration: "none", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.16)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(239,68,68,0.2)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <AlertTriangle size={16} /> Report Emergency
          </Link>
        </div>

        {/* ── Metric Cards ───────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
        }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{
              background: "rgba(15,22,36,0.75)",
              border: `1px solid ${stat.accent ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "14px",
              padding: "26px 12px 22px",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              cursor: "default",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-5px)";
              el.style.borderColor = stat.accent ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.15)";
              el.style.boxShadow = stat.accent ? "0 12px 36px rgba(59,130,246,0.15)" : "0 12px 36px rgba(0,0,0,0.5)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = stat.accent ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.06)";
              el.style.boxShadow = "none";
            }}
            >
              {/* Top edge shine */}
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                background: stat.accent
                  ? "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
              }} />
              <div style={{
                fontSize: "2.4rem", fontWeight: 900,
                letterSpacing: "-0.04em", lineHeight: 1,
                color: stat.accent ? "#3b82f6" : "#ffffff",
                marginBottom: "10px",
                textShadow: stat.accent ? "0 0 24px rgba(59,130,246,0.45)" : "none",
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: "9px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.18em",
                color: "#475569", fontFamily: "var(--font-mono)", lineHeight: 1.5,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ══════════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════════ */}
      <section style={{
        position: "relative", zIndex: 10,
        padding: "0 32px 140px",
        maxWidth: "1160px", margin: "0 auto",
      }}>

        {/* Section Label */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "4px 14px",
            background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: "999px", color: "#60a5fa",
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "var(--font-mono)", marginBottom: "16px",
          }}>
            <Zap size={9} /> Platform Capabilities
          </div>
          <h3 style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 900,
            color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.1,
            marginBottom: "12px",
          }}>
            Every Tool a Responder Needs
          </h3>
          <p style={{ fontSize: "14px", color: "#475569", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75 }}>
            From AI-powered weather triage to real-time marine safety — all in one mission-critical platform.
          </p>
        </div>

        {/* Features Grid — 3 cols */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}>
          {[
            {
              icon: "🤖",
              color: "#60a5fa",
              glow: "rgba(59,130,246,0.12)",
              border: "rgba(59,130,246,0.2)",
              title: "WeatherGPT — AI Advisory",
              desc: "Zero-hallucination LLM engine grounded in live IMD + Open-Meteo telemetry. Answers in 8 Indian languages with WBGT heat index, aquaplaning risk, and crop spray windows.",
              tag: "DETERMINISTIC AI",
              href: "/chat",
              linkLabel: "Open Chat →",
            },
            {
              icon: "📡",
              color: "#ef4444",
              glow: "rgba(239,68,68,0.1)",
              border: "rgba(239,68,68,0.2)",
              title: "Live Alert Command Center",
              desc: "CAP-XML v1.2 feeds from NDMA/SACHET with severity triage, geofenced zone mapping, and one-click cell-broadcast dispatch to all towers in the hazard radius.",
              tag: "REAL-TIME",
              href: "/alerts",
              linkLabel: "View Alerts →",
            },
            {
              icon: "🖥️",
              color: "#60a5fa",
              glow: "rgba(59,130,246,0.1)",
              border: "rgba(59,130,246,0.2)",
              title: "Command Dashboard",
              desc: "Unified ops center with live incident feeds, responder geolocation, SOS verification queue, and resource dispatch controls for field coordinators.",
              tag: "MISSION CONTROL",
              href: "/dashboard",
              linkLabel: "Launch Dashboard →",
            },
            {
              icon: "🗺️",
              color: "#f59e0b",
              glow: "rgba(245,158,11,0.1)",
              border: "rgba(245,158,11,0.2)",
              title: "Route Safety Assessor",
              desc: "OSRM-powered routing with real-time flood inundation overlays, aquaplaning risk scoring, and alternative route suggestions for car, bike, and heavy vehicles.",
              tag: "GIS + ROUTING",
              href: "/travel",
              linkLabel: "Check My Route →",
            },
            {
              icon: "🌾",
              color: "#a3e635",
              glow: "rgba(163,230,53,0.08)",
              border: "rgba(163,230,53,0.18)",
              title: "Agro-Marine Advisory",
              desc: "ICAR & CIBRC certified pesticide spray windows for farmers with rain/wind guardrails. INCOIS ocean telemetry + PFZ fishing zone safety for coastal fishermen.",
              tag: "ICAR · INCOIS",
              href: "/agro-marine",
              linkLabel: "Explore Advisory →",
            },
            {
              icon: "🆘",
              color: "#f43f5e",
              glow: "rgba(244,63,94,0.1)",
              border: "rgba(244,63,94,0.2)",
              title: "Citizen SOS Reporter",
              desc: "3-step anonymous distress reporting — no account needed. End-to-end encrypted, dispatched to the nearest Response Command Center instantly with SOS ID confirmation.",
              tag: "NO ACCOUNT NEEDED",
              href: "/citizen",
              linkLabel: "Report Emergency →",
            },
          ].map((f, i) => (
            <div key={f.title}
              style={{
                background: "rgba(15,22,36,0.8)",
                border: `1px solid ${f.border}`,
                borderRadius: "16px", padding: "26px 22px",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                cursor: "default", position: "relative", overflow: "hidden",
                animation: `fadeUp 0.6s ease both`,
                animationDelay: `${0.08 * i}s`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-6px)";
                el.style.background = f.glow;
                el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${f.border}`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.background = "rgba(15,22,36,0.8)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Top shine line */}
              <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)`,
              }} />

              {/* Icon */}
              <div style={{
                width: "44px", height: "44px", borderRadius: "11px",
                background: f.glow, border: `1px solid ${f.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginBottom: "16px",
              }}>
                {f.icon}
              </div>

              {/* Tag */}
              <div style={{
                fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em",
                textTransform: "uppercase", color: f.color, fontFamily: "var(--font-mono)",
                marginBottom: "7px",
              }}>
                {f.tag}
              </div>

              {/* Title */}
              <h4 style={{ fontSize: "14.5px", fontWeight: 800, color: "#fff", marginBottom: "10px", lineHeight: 1.3 }}>
                {f.title}
              </h4>

              {/* Desc */}
              <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.75, marginBottom: "18px" }}>
                {f.desc}
              </p>

              {/* Link */}
              <a href={f.href} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                fontSize: "11.5px", fontWeight: 700, color: f.color,
                textDecoration: "none", letterSpacing: "0.02em",
                transition: "gap 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.gap = "8px")}
              onMouseLeave={e => (e.currentTarget.style.gap = "5px")}
              >
                {f.linkLabel}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FLOATING COMMAND DOCK
      ══════════════════════════════════════════════ */}
      <div style={{
        position: "fixed", bottom: "20px",
        left: "50%", transform: "translateX(-50%)",
        width: "min(580px, calc(100vw - 40px))",
        zIndex: 100,
      }}>
        <div style={{
          background: "rgba(10,15,25,0.95)",
          border: "1px solid rgba(96,165,250,0.25)",
          borderRadius: "18px",
          padding: "8px 8px 8px 16px",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(59,130,246,0.06), 0 -1px 0 rgba(96,165,250,0.12)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          {/* Icon */}
          <div style={{
            width: "30px", height: "30px", borderRadius: "9px", flexShrink: 0,
            background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={14} color="#60a5fa" />
          </div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Query WeatherGPT or execute command..."
            onKeyDown={e => { if (e.key === "Enter" && query.trim()) window.location.href = `/chat?q=${encodeURIComponent(query)}`; }}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#f0f4ff", fontSize: "13px", fontFamily: "var(--font-sans)",
            }}
          />

          {/* Execute */}
          <Link
            href={query.trim() ? `/chat?q=${encodeURIComponent(query)}` : "/chat"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 16px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#ffffff",
              borderRadius: "12px", fontWeight: 700, fontSize: "12px",
              textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
              transition: "all 0.18s",
              letterSpacing: "0.04em",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1d4ed8, #2563eb)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #2563eb, #3b82f6)"; }}
          >
            <Send size={12} /> Execute
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          GLOBAL STYLES
      ══════════════════════════════════════════════ */}
      <style>{`
        .live-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239,68,68,0.9);
          animation: livePulse 1.6s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(239,68,68,0.9); }
          50% { opacity: 0.6; transform: scale(0.8); box-shadow: 0 0 14px rgba(239,68,68,0.5); }
        }

        /* Subtle fadeup for hero items */
        main > * {
          animation: fadeUp 0.6s ease both;
        }
        main > *:nth-child(1) { animation-delay: 0.05s; }
        main > *:nth-child(2) { animation-delay: 0.12s; }
        main > *:nth-child(3) { animation-delay: 0.18s; }
        main > *:nth-child(4) { animation-delay: 0.24s; }
        main > *:nth-child(5) { animation-delay: 0.30s; }
        main > *:nth-child(6) { animation-delay: 0.36s; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.25); border-radius: 99px; }

        /* Remove AppNav global header on this route */
        body { overflow-x: hidden; }
      `}</style>
    </div>
  );
}
