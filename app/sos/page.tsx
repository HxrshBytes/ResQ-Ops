"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Waves, Mountain, CloudRain, Tornado, ThermometerSun, 
  Building2, Flame, Ambulance, Car, AlertCircle, Phone 
} from "lucide-react";

const INCIDENT_TYPES = [
  { id: "flood", label: "Urban Flood", icon: Waves },
  { id: "landslide", label: "Landslide", icon: Mountain },
  { id: "cloudburst", label: "Cloudburst", icon: CloudRain },
  { id: "cyclone", label: "Cyclone", icon: Tornado },
  { id: "heatwave", label: "Heatwave", icon: ThermometerSun },
  { id: "collapse", label: "Structural Collapse", icon: Building2 },
  { id: "fire", label: "Fire", icon: Flame },
  { id: "medical", label: "Medical Emergency", icon: Ambulance },
  { id: "accident", label: "Road Accident", icon: Car },
  { id: "other", label: "Other", icon: AlertCircle },
];

const LIFE_THREAT_TYPES = ["collapse", "fire", "medical", "accident"];

interface FormData {
  type: string;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  landmark: string;
  people: number;
  trapped: boolean;
  injured: boolean;
  note: string;
  photo: string | null;
}

export default function CitizenPage() {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [form, setForm] = useState<FormData>({
    type: "",
    lat: null,
    lng: null,
    accuracyM: null,
    landmark: "",
    people: 1,
    trapped: false,
    injured: false,
    note: "",
    photo: null,
  });
  
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; trackingCode: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);

  useEffect(() => {
    // Generate UUID v4 for clientId if not exists
    let cid = localStorage.getItem("resq_client_id");
    if (!cid) {
      cid = crypto.randomUUID();
      localStorage.setItem("resq_client_id", cid);
    }
    setClientId(cid);
  }, []);

  const detectLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ 
          ...f, 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy 
        }));
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        // Error handled by requiring landmark
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Compress to 1280px JPEG
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let width = img.width;
      let height = img.height;
      if (width > 1280) {
        height = (1280 * height) / width;
        width = 1280;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      setForm(f => ({ ...f, photo: canvas.toDataURL("image/jpeg", 0.7) }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const submitPayload = async (payload: any) => {
    try {
      if (!navigator.onLine) throw new Error("Offline");
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Server error");
      return await res.json();
    } catch (e) {
      throw e;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      clientId,
      type: form.type,
      lat: form.lat,
      lng: form.lng,
      accuracyM: form.accuracyM,
      landmark: form.landmark,
      people: form.people,
      trapped: form.trapped,
      injured: form.injured,
      note: form.note,
      photo: form.photo,
      createdAt: new Date().toISOString(),
      lang: navigator.language || "en"
    };

    try {
      const data = await submitPayload(payload);
      setSubmitted(data);
    } catch (err) {
      // Save to local storage for auto-send
      const pending = JSON.parse(localStorage.getItem("resq_pending_sos") || "[]");
      pending.push(payload);
      localStorage.setItem("resq_pending_sos", JSON.stringify(pending));
      setOfflineSaved(true);
      setSubmitted({ id: "offline-" + Date.now(), trackingCode: "PENDING" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      const pending = JSON.parse(localStorage.getItem("resq_pending_sos") || "[]");
      if (pending.length > 0) {
        for (const payload of pending) {
          try {
            await submitPayload(payload);
          } catch (e) {
            return; // Still failing, try next time
          }
        }
        localStorage.setItem("resq_pending_sos", "[]");
        if (offlineSaved) {
          setOfflineSaved(false); // Optionally refresh status
        }
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [offlineSaved]);

  useEffect(() => {
    if (submitted && !offlineSaved) {
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/incidents`);
          if (res.ok) {
            const data = await res.json();
            const inc = data.find((i: any) => i.id === submitted.id);
            if (inc) setStatus(inc.status);
          }
        } catch (e) {}
      }, 10000);
      return () => clearInterval(poll);
    }
  }, [submitted, offlineSaved]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: prefersReducedMotion ? 0 : direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const [[page, direction], setPage] = useState([1, 0]);

  const paginate = (newStep: number) => {
    setPage([newStep, newStep > step ? 1 : -1]);
    setStep(newStep);
  };

  const isLifeThreatening = LIFE_THREAT_TYPES.includes(form.type);

  const canProceedStep2 = form.lat !== null || form.landmark.length >= 3;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)", color: "var(--text-primary)" }}>
      
      {/* 112 Sticky Button */}
      <a href="tel:112" className="btn btn-primary" style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 100, borderRadius: 50,
        boxShadow: "0 4px 20px rgba(255,43,74,0.6)"
      }}>
        <Phone size={20} /> Call 112
      </a>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px", overflow: "hidden" }}>
        
        {!submitted ? (
          <>
            {/* Progress Steps */}
            <div style={{ display: "flex", gap: 0, marginBottom: 40 }}>
              {["Hazard", "Location & People", "Review & Send"].map((label, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {i < 2 && <div style={{ position: "absolute", top: 16, left: "50%", width: "100%", height: 2, background: step > i + 1 ? "var(--info)" : "var(--border-subtle)", zIndex: 0 }} />}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      zIndex: 1,
                      background: step > i ? "var(--info)" : step === i + 1 ? "var(--bg-elevated)" : "var(--bg-surface)",
                      border: `2px solid ${step >= i + 1 ? "var(--info)" : "var(--border-subtle)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: step > i ? "#fff" : step === i + 1 ? "var(--info)" : "var(--text-muted)",
                    }}
                  >
                    {step > i ? "✓" : i + 1}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: step === i + 1 ? "var(--text-primary)" : "var(--text-muted)", marginTop: 6, textAlign: "center" }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="glass" style={{ padding: 32, position: "relative", minHeight: 400 }}>
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={page}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ width: "100%" }}
                >
                  {/* Step 1: Hazard Type */}
                  {step === 1 && (
                    <div>
                      <h1 style={{ fontSize: "1.3rem", marginBottom: 20 }}>🚨 Pick the Hazard</h1>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                        {INCIDENT_TYPES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                            style={{
                              padding: "16px 12px",
                              borderRadius: "var(--radius-md)",
                              cursor: "pointer",
                              background: form.type === t.id ? "rgba(59,158,255,0.12)" : "var(--bg-surface)",
                              border: `1px solid ${form.type === t.id ? "rgba(59,158,255,0.5)" : "var(--border-subtle)"}`,
                              color: form.type === t.id ? "var(--info)" : "var(--text-secondary)",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                              transition: "all 0.15s",
                            }}
                          >
                            <t.icon size={28} />
                            <span style={{ fontSize: "0.8rem", fontWeight: form.type === t.id ? 600 : 400, textAlign: "center" }}>{t.label}</span>
                          </button>
                        ))}
                      </div>

                      {isLifeThreatening && (
                        <div style={{ background: "rgba(255,43,74,0.15)", padding: 16, borderRadius: "var(--radius-md)", color: "var(--critical)", fontSize: "0.85rem", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
                          <AlertCircle size={24} />
                          <strong>If life is in danger, call 112 now.</strong>
                        </div>
                      )}

                      <button className="btn btn-primary" style={{ width: "100%" }} disabled={!form.type} onClick={() => paginate(2)}>
                        Continue →
                      </button>
                    </div>
                  )}

                  {/* Step 2: Location & Details */}
                  {step === 2 && (
                    <div>
                      <h2 style={{ fontSize: "1.2rem", marginBottom: 20 }}>📍 Location & People</h2>

                      <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Auto-detect GPS</label>
                        <button className="btn btn-teal" style={{ width: "100%", justifyContent: "center" }} onClick={detectLocation} disabled={geoLoading}>
                          {geoLoading ? "Detecting..." : form.lat ? `GPS Acquired (${form.accuracyM?.toFixed(0)}m accuracy)` : "📍 Detect Location"}
                        </button>
                      </div>

                      <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Landmark {form.lat ? "(Optional)" : "(Required)"}</label>
                        <input className="input" value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} placeholder="Near post office..." />
                        {!form.lat && form.landmark.length > 0 && form.landmark.length < 3 && (
                          <div style={{ color: "var(--high)", fontSize: "0.7rem", marginTop: 4 }}>Landmark must be at least 3 characters.</div>
                        )}
                      </div>

                      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                        <label style={{ fontSize: "0.85rem" }}>People Affected</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <button onClick={() => setForm(f => ({ ...f, people: Math.max(1, f.people - 1) }))} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "white" }}>-</button>
                          <span style={{ fontSize: "1.1rem", fontWeight: 700, width: 24, textAlign: "center" }}>{form.people}</span>
                          <button onClick={() => setForm(f => ({ ...f, people: f.people + 1 }))} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "white" }}>+</button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                        <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: form.trapped ? "rgba(255,107,26,0.15)" : "var(--bg-surface)", padding: 12, borderRadius: "var(--radius-md)", border: `1px solid ${form.trapped ? "var(--high)" : "var(--border-subtle)"}`, cursor: "pointer" }}>
                          <input type="checkbox" checked={form.trapped} onChange={(e) => setForm(f => ({ ...f, trapped: e.target.checked }))} />
                          <span style={{ fontSize: "0.85rem", color: form.trapped ? "var(--high)" : "var(--text-secondary)" }}>Trapped</span>
                        </label>
                        <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: form.injured ? "rgba(255,43,74,0.15)" : "var(--bg-surface)", padding: 12, borderRadius: "var(--radius-md)", border: `1px solid ${form.injured ? "var(--critical)" : "var(--border-subtle)"}`, cursor: "pointer" }}>
                          <input type="checkbox" checked={form.injured} onChange={(e) => setForm(f => ({ ...f, injured: e.target.checked }))} />
                          <span style={{ fontSize: "0.85rem", color: form.injured ? "var(--critical)" : "var(--text-secondary)" }}>Injured</span>
                        </label>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-ghost" onClick={() => paginate(1)}>← Back</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canProceedStep2} onClick={() => paginate(3)}>Continue →</button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Evidence & Submit */}
                  {step === 3 && (
                    <div>
                      <h2 style={{ fontSize: "1.2rem", marginBottom: 20 }}>📝 Review & Send</h2>
                      
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Photo (Optional)</label>
                        <input type="file" accept="image/jpeg, image/png" id="photo" style={{ display: "none" }} onChange={handlePhotoUpload} />
                        <label htmlFor="photo" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", cursor: "pointer", display: "flex" }}>
                          {form.photo ? "📷 Photo Attached" : "📷 Attach Photo"}
                        </label>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Note (Max 280 chars)</label>
                        <textarea className="input" rows={3} maxLength={280} value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Additional details..." />
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: 24, fontSize: "0.8rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div><span style={{ color: "var(--text-muted)" }}>Hazard:</span> {INCIDENT_TYPES.find(t => t.id === form.type)?.label}</div>
                        <div><span style={{ color: "var(--text-muted)" }}>People:</span> {form.people} {form.trapped && <span style={{ color: "var(--high)" }}>(Trapped)</span>} {form.injured && <span style={{ color: "var(--critical)" }}>(Injured)</span>}</div>
                        <div style={{ gridColumn: "1/-1" }}><span style={{ color: "var(--text-muted)" }}>Location:</span> {form.lat ? "GPS" : form.landmark}</div>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-ghost" onClick={() => paginate(2)}>← Back</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                          {submitting ? "Sending..." : "Send Report"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="glass" style={{ padding: 40, textAlign: "center" }}
          >
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{ width: 64, height: 64, borderRadius: "50%", background: offlineSaved ? "var(--moderate)" : "var(--low)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}
            >
              {offlineSaved ? <AlertCircle size={32} color="black" /> : <motion.svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </motion.svg>}
            </motion.div>
            
            <h1 style={{ fontSize: "1.4rem", marginBottom: 12 }}>
              {offlineSaved ? "Saved on this phone" : "SOS Sent Successfully"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>
              {offlineSaved ? "You are offline. The report will auto-send when connection is restored." : `Status: ${status || "received"}`}
            </p>

            <button className="btn btn-ghost" onClick={() => {
              setSubmitted(null);
              setOfflineSaved(false);
              paginate(1);
              setForm({ type: "", lat: null, lng: null, accuracyM: null, landmark: "", people: 1, trapped: false, injured: false, note: "", photo: null });
            }}>
              Submit Another
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
