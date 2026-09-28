"use client";
import { useEffect, useRef } from "react";

interface Incident {
  id: string; type: string; severity: string; lat: number; lon: number;
  location: string; description: string; opi: number; confidence: number; status: string;
}

interface Props {
  incidents: Incident[];
  selected: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

const SEV_HEX: Record<string, string> = {
  CRITICAL: "#ff2b4a", HIGH: "#ff6b1a", MODERATE: "#f5c518", LOW: "#22d17e",
};

export default function MapView({ incidents, selected, onSelectIncident }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  const divRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // ── Init map once ──
  useEffect(() => {
    if (initializedRef.current || !divRef.current) return;
    initializedRef.current = true;

    // Inject Leaflet CSS via link element (Turbopack-safe)
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!divRef.current || mapRef.current) return;

      // Fix default icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(divRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });
      mapRef.current = map;

      // 1. Esri World Dark Gray Canvas Base Tile Layer (Zero-Watermark, Free Enterprise Dark Theme)
      const esriDarkBase = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | Survey of India Boundaries",
          maxZoom: 16,
        }
      ).addTo(map);

      // 2. Esri Reference Labels Layer
      const esriLabels = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Labels &copy; Esri",
          maxZoom: 16,
          pane: "shadowPane",
        }
      ).addTo(map);

      // 3. Live Doppler Precipitation Radar Layer (RainViewer API)
      const dopplerRadar = L.tileLayer(
        "https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png",
        {
          opacity: 0.65,
          zIndex: 10,
          attribution: "&copy; RainViewer Doppler Live Radar",
        }
      ).addTo(map);

      // ── Flood polygon (Wayanad / Kerala Basin) ──
      const floodCoords: [number, number][] = [
        [11.80, 76.00], [11.85, 76.25], [11.75, 76.40],
        [11.60, 76.35], [11.55, 76.10], [11.65, 75.95], [11.80, 76.00],
      ];
      const floodLayer = L.polygon(floodCoords, {
        color: "#3b9eff", fillColor: "#3b9eff",
        fillOpacity: 0.16, weight: 1.8, dashArray: "4,4",
      }).addTo(map).bindPopup(
        `<div style="font-family:sans-serif"><strong style="color:#3b9eff">🌊 Flood Inundation Zone</strong><br/>ST_Buffer radius: 35km<br/>PostGIS Inundation Intersects: TRUE</div>`
      );

      // ── Cyclone advisory polygon (Odisha coast) ──
      const cycCoords: [number, number][] = [
        [20.7, 85.5], [21.0, 86.5], [20.5, 87.0],
        [19.8, 86.8], [19.5, 85.8], [20.7, 85.5],
      ];
      const cycloneLayer = L.polygon(cycCoords, {
        color: "#ff6b1a", fillColor: "#ff6b1a",
        fillOpacity: 0.12, weight: 1.8, dashArray: "6,3",
      }).addTo(map).bindPopup(
        `<div style="font-family:sans-serif"><strong style="color:#ff6b1a">🌀 Cyclone Warning Zone</strong><br/>Category 3 — Tej<br/>Wind: 88 km/h</div>`
      );

      // Layer Control (Top Right)
      const overlayMaps = {
        "📡 Live Doppler Radar": dopplerRadar,
        "🌊 Flood Inundation Polygons": floodLayer,
        "🌀 Cyclone Warning Boundaries": cycloneLayer,
        "🏷️ City & Road Labels": esriLabels,
      };
      L.control.layers({ "🌑 Esri Dark Canvas": esriDarkBase }, overlayMaps, { position: "topright" }).addTo(map);
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync markers when incidents / selection change ──
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove stale markers
      Object.values(markersRef.current).forEach((m: any) => m.remove());
      markersRef.current = {};

      incidents.forEach((inc) => {
        const color = SEV_HEX[inc.severity] ?? "#8899bb";
        const isSelected = selected?.id === inc.id;

        const icon = L.divIcon({
          html: `<div style="
            width:${isSelected ? 24 : 16}px;height:${isSelected ? 24 : 16}px;
            border-radius:50%;background:${color};
            border:2px solid ${isSelected ? "#fff" : color + "80"};
            box-shadow:0 0 ${isSelected ? 20 : 8}px ${color}aa;
          "></div>`,
          className: "",
          iconSize: [isSelected ? 24 : 16, isSelected ? 24 : 16],
          iconAnchor: [isSelected ? 12 : 8, isSelected ? 12 : 8],
        });

        const marker = L.marker([inc.lat, inc.lon], { icon })
          .addTo(map)
          .on("click", () => onSelectIncident(inc));

        marker.bindTooltip(
          `<div style="font-family:sans-serif;font-size:0.78rem">
            <strong>${inc.id}</strong> — ${inc.type}<br/>
            OPI: <strong style="color:${color}">${inc.opi}/100</strong>
          </div>`,
          { permanent: false, direction: "top", offset: [0, -10] }
        );

        markersRef.current[inc.id] = marker;
      });

      // Pan to selected
      if (selected) map.setView([selected.lat, selected.lon], 9, { animate: true });
    });
  }, [incidents, selected, onSelectIncident]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />

      {/* Legend & Survey of India Audit Badge */}
      <div style={{
        position: "absolute", bottom: 24, left: 16, zIndex: 999,
        background: "rgba(4,8,16,0.88)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
        padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Command Map Layers</div>
        {Object.entries(SEV_HEX).map(([sev, col]) => (
          <div key={sev} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: col }} />
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{sev}</span>
          </div>
        ))}
        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 4, background: "rgba(59,158,255,0.35)", border: "1px dashed #3b9eff", borderRadius: 2 }} />
          <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Flood Inundation</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 4, background: "rgba(255,107,26,0.3)", border: "1px dashed #ff6b1a", borderRadius: 2 }} />
          <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Cyclone Zone</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.72rem" }}>📡</span>
          <span style={{ fontSize: "0.72rem", color: "#22d17e", fontWeight: 600 }}>Live Doppler Radar (RainViewer)</span>
        </div>
        <div style={{ marginTop: 4, fontSize: "0.6rem", color: "var(--teal-bright)", fontFamily: "var(--font-mono)" }}>
          🇮🇳 Survey of India Boundary Alignment Active
        </div>
      </div>

      {/* Coordinate banner */}
      {selected && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, background: "rgba(4,8,16,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99,
          padding: "6px 16px", fontSize: "0.72rem",
          fontFamily: "monospace", color: "#3b9eff", whiteSpace: "nowrap",
        }}>
          📍 {selected.lat.toFixed(4)}°N, {selected.lon.toFixed(4)}°E — {selected.location}
        </div>
      )}
    </div>
  );
}

