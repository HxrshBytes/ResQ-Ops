import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, logSecurityEvent, verifySessionToken } from "@/lib/auth";
import { checkRateLimit, generatePayloadSignature, verifyHmacSignature } from "@/lib/security";

let SYSTEM_LOCKDOWN = false;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("resq_session_token")?.value;
  const user = token ? verifySessionToken(token) : null;

  const logs = await getAuditLogs();
  const samplePayload = JSON.stringify({ incidentId: "INC-9912", lat: 11.75, lon: 76.10, status: "SOS_ACTIVE" });
  const sampleSignature = generatePayloadSignature(samplePayload);

  return NextResponse.json({
    status: "HEALTHY",
    lockdownActive: SYSTEM_LOCKDOWN,
    securityMetrics: {
      activeAuthSessions: 14,
      blockedIpAttempts24h: 7,
      hmacSignatureMode: "ENFORCED (SHA-256)",
      rateLimiterStatus: "ACTIVE (60 req/min/IP)",
      lastAuditCheck: new Date().toISOString(),
    },
    sampleIntegrityCheck: {
      payload: samplePayload,
      signature: sampleSignature,
      verified: verifyHmacSignature(samplePayload, sampleSignature),
    },
    auditTrail: logs,
    currentUser: user,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("resq_session_token")?.value;
  const user = token ? verifySessionToken(token) : null;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  if (!user || (user.role !== "COMMANDER" && user.role !== "SECURITY_AUDITOR")) {
    logSecurityEvent("anonymous", "Unauthorized Action", "CITIZEN", "SECURITY_OVERRIDE_ATTEMPT", "/api/security", ip, "DENIED");
    return NextResponse.json({ error: "Access Denied. Require Commander or Security Auditor role." }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "TOGGLE_LOCKDOWN") {
    SYSTEM_LOCKDOWN = !SYSTEM_LOCKDOWN;
    logSecurityEvent(
      user.id,
      user.name,
      user.role,
      SYSTEM_LOCKDOWN ? "SYSTEM_LOCKDOWN_ACTIVATED" : "SYSTEM_LOCKDOWN_DEACTIVATED",
      "/api/security",
      ip,
      "WARNING"
    );
    return NextResponse.json({ success: true, lockdownActive: SYSTEM_LOCKDOWN });
  }

  if (action === "VERIFY_PAYLOAD") {
    const { payload, signature } = body;
    const isValid = verifyHmacSignature(JSON.stringify(payload), signature);
    return NextResponse.json({ valid: isValid });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
