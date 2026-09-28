"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAuthBadge from "./UserAuthBadge";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/dashboard",   label: "Command",     icon: "🖥️" },
  { href: "/alerts",      label: "Alerts",      icon: "📡" },
  { href: "/chat",        label: "WeatherGPT",  icon: "🤖" },
  { href: "/travel",      label: "Travel",      icon: "🗺️" },
  { href: "/citizen",     label: "Report SOS",  icon: "📱" },
];

const MORE = [
  { href: "/agro-marine", label: "Agro-Marine", icon: "🌾" },
  { href: "/analytics",   label: "Analytics",   icon: "📊" },
  { href: "/responder",   label: "Responder",   icon: "🚨" },
];

export default function AppNav({ title, live, children }: { title: string; live?: boolean; children?: React.ReactNode }) {
  const path = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {path !== "/" && (
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: 56, flexShrink: 0,
        background: "rgba(7, 13, 26, 0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Left: logo + breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
            <span className="premium-logo-wrapper">
              <img 
                src="/logo.jpg" 
                alt="ResQ-Ops"
                className="premium-logo" 
                style={{ width: 28, height: 28, flexShrink: 0, objectFit: "cover" }} 
              />
            </span>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.02em" }}>
              <span style={{ color: "var(--critical)" }}>resQ</span>-ops
            </span>
          </Link>
          <span style={{ color: "var(--border-default)" }}>›</span>
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>{title}</span>
          {live && <span className="status-live">LIVE</span>}
        </div>

        {/* Center: nav links (desktop) */}
        <nav className="desktop-nav" style={{ display: "flex", gap: 2 }}>
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link key={n.href} href={n.href} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: "var(--radius-md)",
                fontSize: "0.78rem", fontWeight: 500, textDecoration: "none",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                background: active ? "var(--bg-elevated)" : "transparent",
                border: active ? "1px solid var(--border-default)" : "1px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "var(--text-secondary)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <span style={{ fontSize: "0.85rem" }}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
          
          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setShowMore(!showMore)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: "var(--radius-md)",
                fontSize: "0.78rem", fontWeight: 500, textDecoration: "none",
                color: showMore ? "var(--text-primary)" : "var(--text-muted)",
                background: showMore ? "var(--bg-elevated)" : "transparent",
                border: showMore ? "1px solid var(--border-default)" : "1px solid transparent",
                transition: "all 0.15s",
                cursor: "pointer"
              }}
            >
              More ▾
            </button>
            {showMore && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4,
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)", padding: 8, display: "flex", flexDirection: "column",
                gap: 4, minWidth: 150, zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
              }}>
                {MORE.map(n => (
                  <Link key={n.href} href={n.href} style={{
                    padding: "8px 12px", color: "var(--text-primary)", textDecoration: "none",
                    fontSize: "0.8rem", borderRadius: "var(--radius-sm)", display: "flex", gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => setShowMore(false)}
                  >
                    <span>{n.icon}</span> {n.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right: auth badge + children */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {children}
          <UserAuthBadge />
        </div>
      </header>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(7, 13, 26, 0.9)", backdropFilter: "blur(24px)",
        borderTop: "1px solid var(--border-default)", display: "none",
        justifyContent: "space-around", padding: "8px 0", zIndex: 100,
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))"
      }}>
        {NAV.slice(0, 4).map((n) => {
          const active = path === n.href;
          return (
            <Link key={n.href} href={n.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: active ? "var(--text-primary)" : "var(--text-muted)", textDecoration: "none"
            }}>
              <span style={{ fontSize: "1.2rem" }}>{n.icon}</span>
              <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400 }}>{n.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setShowMore(!showMore)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          color: showMore ? "var(--text-primary)" : "var(--text-muted)",
          background: "none", border: "none", cursor: "pointer"
        }}>
          <span style={{ fontSize: "1.2rem" }}>☰</span>
          <span style={{ fontSize: "0.65rem" }}>More</span>
        </button>
      </nav>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}} />
    </>
  );
}
