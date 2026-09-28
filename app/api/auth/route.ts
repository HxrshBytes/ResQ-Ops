import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifySessionToken, logSecurityEvent, UserRole } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import { authenticateUserCredentials, findUserByEmailOrBadge, getAllUsers, UserRecord } from "@/lib/userStore";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limit login attempts: max 10 per minute per IP
    const rateCheck = checkRateLimit(`login:${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      logSecurityEvent("anonymous", "Failed Login", "CITIZEN", "LOGIN_RATE_EXCEEDED", "/api/auth", ip, "BLOCKED");
      return NextResponse.json(
        { error: "Too many login attempts. Security lock active for 60 seconds." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, badgeId, password, passcode, role } = body;
    const pwd = password || passcode;
    const identifier = email || badgeId;

    let matchedUser: UserRecord | null = null;

    // 1. Check direct credentials if email/badgeId and password are provided
    if (identifier && pwd) {
      matchedUser = await authenticateUserCredentials(identifier, pwd);
    }

    // 2. Fallback: Try finding user by email/badge and verify passcode directly
    if (!matchedUser && identifier) {
      const found = await findUserByEmailOrBadge(identifier);
      if (found && pwd) {
        // Try hashed credential auth first
        matchedUser = await authenticateUserCredentials(identifier, pwd);
      }
    }

    if (!matchedUser) {
      logSecurityEvent("anonymous", identifier || "unknown", "CITIZEN", "AUTH_FAILURE", "/api/auth", ip, "DENIED");
      return NextResponse.json(
        { error: "Invalid Agency Credentials, Badge ID, or Password." },
        { status: 401 }
      );
    }

    // 3. Generate secure token
    const token = createSessionToken(matchedUser);

    // 4. Record audit trail entry
    logSecurityEvent(
      matchedUser.id,
      matchedUser.name,
      matchedUser.role,
      "USER_AUTHENTICATED",
      "/api/auth",
      ip,
      "SUCCESS"
    );

    // 5. Determine role-based redirect path
    const roleRedirects: Record<string, string> = {
      COMMANDER: "/dashboard",
      RESPONDER: "/responder",
      SECURITY_AUDITOR: "/security",
      CITIZEN: "/citizen",
    };
    const redirectTo = roleRedirects[matchedUser.role] || "/dashboard";

    // 6. Respond & set session cookie
    const response = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        badgeId: matchedUser.badgeId,
        role: matchedUser.role,
        agency: matchedUser.agency,
        clearanceLevel: matchedUser.clearanceLevel,
        avatar: matchedUser.avatar,
      },
      token,
    });

    response.cookies.set({
      name: "resq_session_token",
      value: token,
      httpOnly: false, // Accessible to client context & middleware
      path: "/",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Authentication internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("resq_session_token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const user = verifySessionToken(token);
  if (!user) {
    const res = NextResponse.json({ authenticated: false, user: null });
    res.cookies.delete("resq_session_token");
    return res;
  }

  return NextResponse.json({ authenticated: true, user });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("resq_session_token")?.value;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  if (token) {
    const user = verifySessionToken(token);
    if (user) {
      logSecurityEvent(user.id, user.name, user.role, "USER_LOGOUT", "/api/auth", ip, "SUCCESS");
    }
  }

  const response = NextResponse.json({ success: true, message: "Session terminated successfully." });
  response.cookies.delete("resq_session_token");
  return response;
}
