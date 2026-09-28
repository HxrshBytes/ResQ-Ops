import crypto from "crypto";

// ══════════════════════════════════════════════════════
//  ResQ-Ops Auth Library — No DB dependency (in-memory)
//  All user data lives in DEMO_USERS below.
//  For production: swap in-memory store for PostgreSQL.
// ══════════════════════════════════════════════════════

export type UserRole = "COMMANDER" | "RESPONDER" | "SECURITY_AUDITOR" | "CITIZEN";

export interface SecurityUser {
  id: string;
  name: string;
  email: string;
  badgeId: string;
  role: UserRole;
  agency: string;
  clearanceLevel: string;
  avatar: string;
  lastLogin: string;
  mfaVerified: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  resource: string;
  ip: string;
  status: "SUCCESS" | "DENIED" | "BLOCKED" | "WARNING";
  checksum: string;
}

// ── Pre-configured Security Identities for Evaluation & Field Ops ──
export const DEMO_USERS: Record<UserRole, SecurityUser & { passcode: string }> = {
  COMMANDER: {
    id: "usr_cmd_001",
    name: "Commander Rajesh Sharma",
    email: "commander@ndma.gov.in",
    badgeId: "NDMA-HQ-8921",
    role: "COMMANDER",
    agency: "National Disaster Management Authority (NDMA)",
    clearanceLevel: "LEVEL 4 — FULL DISPATCH & HITL COMMAND",
    avatar: "🛡️",
    lastLogin: new Date().toISOString(),
    mfaVerified: true,
    passcode: "ResQ-Ops#2026",
  },
  RESPONDER: {
    id: "usr_res_044",
    name: "Capt. Anita Deshmukh",
    email: "sentry.field@ndrf.gov.in",
    badgeId: "NDRF-BN10-449",
    role: "RESPONDER",
    agency: "10th NDRF Battalion (Tactical Unit)",
    clearanceLevel: "LEVEL 2 — FIELD TRIAGE & SENTRY SQUAD",
    avatar: "🚨",
    lastLogin: new Date().toISOString(),
    mfaVerified: true,
    passcode: "Sentry#Field99",
  },
  SECURITY_AUDITOR: {
    id: "usr_sec_909",
    name: "Dr. Vikram Sethi",
    email: "sec.audit@cert-in.gov.in",
    badgeId: "CERTIN-SOC-909",
    role: "SECURITY_AUDITOR",
    agency: "Indian Computer Emergency Response Team (CERT-In)",
    clearanceLevel: "LEVEL 3 — AUDIT & THREAT INSPECTION",
    avatar: "🔒",
    lastLogin: new Date().toISOString(),
    mfaVerified: true,
    passcode: "Audit#CERT2026",
  },
  CITIZEN: {
    id: "usr_cit_881",
    name: "Karan Patel (Public Liaison)",
    email: "citizen@resq-ops.gov.in",
    badgeId: "PUB-SOS-881",
    role: "CITIZEN",
    agency: "Civil Defense & Public Emergency Liaison",
    clearanceLevel: "LEVEL 1 — PUBLIC SOS & ADVISORY",
    avatar: "📱",
    lastLogin: new Date().toISOString(),
    mfaVerified: false,
    passcode: "Citizen#Public",
  },
};

// ── In-Memory Security Audit Log Buffer ──
const AUDIT_LOG_BUFFER: AuditLogEntry[] = [
  {
    id: "aud_1001",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: "usr_cmd_001",
    userName: "Commander Rajesh Sharma",
    role: "COMMANDER",
    action: "DISPATCH_FLEET_OVERRIDE",
    resource: "/api/incidents/dispatch",
    ip: "10.4.12.88",
    status: "SUCCESS",
    checksum: "a1b2c3d4e5f60001",
  },
  {
    id: "aud_1002",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    userId: "usr_sec_909",
    userName: "Dr. Vikram Sethi",
    role: "SECURITY_AUDITOR",
    action: "HMAC_INTEGRITY_AUDIT",
    resource: "/api/security/verify",
    ip: "10.4.12.99",
    status: "SUCCESS",
    checksum: "f0e9d8c7b6a50002",
  },
  {
    id: "aud_1003",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    userId: "anonymous",
    userName: "Unauthenticated Endpoint Request",
    role: "CITIZEN",
    action: "RATE_LIMIT_EXCEEDED_BURST",
    resource: "/api/incidents",
    ip: "185.220.101.5",
    status: "BLOCKED",
    checksum: "1a2b3c4d5e6f0003",
  },
  {
    id: "aud_1004",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    userId: "usr_res_044",
    userName: "Capt. Anita Deshmukh",
    role: "RESPONDER",
    action: "FIELD_DISPATCH_ACCEPTED",
    resource: "/api/incidents/INC-007/dispatch",
    ip: "10.4.15.22",
    status: "SUCCESS",
    checksum: "2b3c4d5e6f700004",
  },
];

export function generateChecksum(userId: string, action: string): string {
  const secret = process.env.SECURITY_HMAC_SECRET || "resq-ops-hmac-2026-secret-key";
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${action}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
}

export function logSecurityEvent(
  userId: string,
  userName: string,
  role: UserRole,
  action: string,
  resource: string,
  ip = "127.0.0.1",
  status: "SUCCESS" | "DENIED" | "BLOCKED" | "WARNING" = "SUCCESS"
) {
  const entry: AuditLogEntry = {
    id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    role,
    action,
    resource,
    ip,
    status,
    checksum: generateChecksum(userId, action),
  };
  // Push to in-memory buffer (capped at 200 entries)
  AUDIT_LOG_BUFFER.unshift(entry);
  if (AUDIT_LOG_BUFFER.length > 200) AUDIT_LOG_BUFFER.pop();
  return entry;
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  // Return in-memory buffer — no DB needed
  return [...AUDIT_LOG_BUFFER].slice(0, 100);
}

// ── JWT / Session Cookie Helpers ──
export const SESSION_COOKIE_NAME = "resq_session_token";

export function createSessionToken(user: SecurityUser): string {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    badgeId: user.badgeId,
    role: user.role,
    clearanceLevel: user.clearanceLevel,
    agency: user.agency,
    iat: Date.now(),
    exp: Date.now() + 86400 * 1000, // 24 hours
  };
  const secret = process.env.JWT_SECRET || "resq-ops-jwt-secure-session-key-2026";
  const base64Str = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(base64Str)
    .digest("base64url");
  return `${base64Str}.${signature}`;
}

export function verifySessionToken(
  token: string
): (SecurityUser & { iat: number; exp: number }) | null {
  if (!token || !token.includes(".")) return null;
  const [base64Str, signature] = token.split(".");
  const secret = process.env.JWT_SECRET || "resq-ops-jwt-secure-session-key-2026";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(base64Str)
    .digest("base64url");
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(base64Str, "base64url").toString("utf-8"));
    if (Date.now() > payload.exp) return null;
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      badgeId: payload.badgeId,
      role: payload.role,
      agency: payload.agency,
      clearanceLevel: payload.clearanceLevel,
      avatar: DEMO_USERS[payload.role as UserRole]?.avatar ?? "🛡️",
      lastLogin: new Date(payload.iat).toISOString(),
      mfaVerified: true,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
