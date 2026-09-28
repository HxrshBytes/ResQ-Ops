import { NextResponse } from "next/server";
import crypto from "crypto";

// ── Sliding Window In-Memory Rate Limiter ──
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_MAP = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Enforces sliding window rate limit per IP or token.
 * Default: 60 requests per 60 seconds.
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  const bucket = RATE_LIMIT_MAP.get(key);

  if (!bucket || now > bucket.resetTime) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, resetMs: windowMs };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs: bucket.resetTime - now,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - bucket.count,
    resetMs: bucket.resetTime - now,
  };
}

// ── Anti-Tamper Payload Signature Verification ──
export function verifyHmacSignature(payload: string, signature: string, secretKey?: string): boolean {
  if (!signature) return false;
  const secret = secretKey || process.env.SOS_HMAC_SECRET || "resq-sos-payload-signature-key-2026";
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

export function generatePayloadSignature(payload: string, secretKey?: string): string {
  const secret = secretKey || process.env.SOS_HMAC_SECRET || "resq-sos-payload-signature-key-2026";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ── HTTP Security Headers Application ──
export function applySecurityHeaders(res: NextResponse): NextResponse {
  // Prevent clickjacking
  res.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");
  // Cross-Site Scripting filter
  res.headers.set("X-XSS-Protection", "1; mode=block");
  // Referrer Policy
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Strict Transport Security (HSTS)
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  // Content Security Policy
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:;"
  );

  return res;
}
