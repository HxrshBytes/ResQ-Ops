import crypto from "crypto";
import { DEMO_USERS, SecurityUser, UserRole } from "./auth";

// ══════════════════════════════════════════════════════
//  ResQ-Ops User Store — In-Memory (No DB Required)
//  Uses DEMO_USERS from auth.ts as the canonical source.
//  For production: replace pool.query calls with real DB.
// ══════════════════════════════════════════════════════

export interface UserRecord extends SecurityUser {
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Build in-memory user records from DEMO_USERS
function buildUserRecord(
  user: (typeof DEMO_USERS)[UserRole],
  passcode: string
): UserRecord {
  const salt = "resq-ops-static-salt-2026"; // static for demo determinism
  return {
    ...user,
    passwordHash: hashPassword(passcode, salt),
    salt,
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
  };
}

const USER_DB: UserRecord[] = Object.values(DEMO_USERS).map((u) =>
  buildUserRecord(u, u.passcode)
);

// ── Public User Database Methods ──

export async function findUserByEmail(
  email: string
): Promise<UserRecord | undefined> {
  return USER_DB.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );
}

export async function findUserByBadgeId(
  badgeId: string
): Promise<UserRecord | undefined> {
  return USER_DB.find(
    (u) => u.badgeId.toLowerCase() === badgeId.toLowerCase().trim()
  );
}

export async function findUserByEmailOrBadge(
  identifier: string
): Promise<UserRecord | undefined> {
  const clean = identifier.trim().toLowerCase();
  return USER_DB.find(
    (u) =>
      u.email.toLowerCase() === clean || u.badgeId.toLowerCase() === clean
  );
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  return USER_DB.find((u) => u.id === id);
}

export async function getAllUsers(): Promise<UserRecord[]> {
  return [...USER_DB];
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  badgeId?: string;
}

export async function registerUser(input: RegisterInput): Promise<UserRecord> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const salt = generateSalt();
  const newUser: UserRecord = {
    id: `usr_${Date.now()}`,
    name: input.fullName,
    email: input.email,
    badgeId: input.badgeId || `BADGE-${Date.now()}`,
    role: input.role,
    agency: "ResQ-Ops Platform",
    clearanceLevel: "LEVEL 1 — PUBLIC SOS & ADVISORY",
    avatar: "👤",
    lastLogin: new Date().toISOString(),
    mfaVerified: false,
    passwordHash: hashPassword(input.password, salt),
    salt,
    createdAt: new Date().toISOString(),
  };
  USER_DB.push(newUser);
  return newUser;
}

export async function authenticateUserCredentials(
  identifier: string,
  password: string
): Promise<UserRecord | null> {
  const user = await findUserByEmailOrBadge(identifier);
  if (!user) return null;

  const attemptHash = hashPassword(password, user.salt);
  if (attemptHash !== user.passwordHash) return null;

  return user;
}
