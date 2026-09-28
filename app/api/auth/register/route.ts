import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/userStore";
import { createSessionToken, logSecurityEvent, UserRole } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limit registration attempts: max 10 per minute per IP
    const rateCheck = checkRateLimit(`register:${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      logSecurityEvent("anonymous", "Failed Register", "CITIZEN", "REGISTER_RATE_EXCEEDED", "/api/auth/register", ip, "BLOCKED");
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { fullName, email, password, role, badgeId } = body;

    // Input Validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Full Name must be at least 2 characters long." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid official email address." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const validRoles: UserRole[] = ["CITIZEN", "RESPONDER", "COMMANDER", "SECURITY_AUDITOR"];
    const assignedRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : "CITIZEN";

    // Create user in database store
    let newUser;
    try {
      newUser = await registerUser({
        fullName,
        email,
        password,
        role: assignedRole,
        badgeId,
      });
    } catch (err: any) {
      logSecurityEvent("anonymous", email, assignedRole, "REGISTER_CONFLICT", "/api/auth/register", ip, "DENIED");
      return NextResponse.json({ error: err.message || "User registration failed." }, { status: 400 });
    }

    // Generate JWT Session Token
    const token = createSessionToken(newUser);

    // Record Security Audit Log
    logSecurityEvent(
      newUser.id,
      newUser.name,
      newUser.role,
      "USER_REGISTERED",
      "/api/auth/register",
      ip,
      "SUCCESS"
    );

    // Respond & set session cookie
    const response = NextResponse.json({
      success: true,
      message: "Account created and authenticated successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        badgeId: newUser.badgeId,
        role: newUser.role,
        agency: newUser.agency,
        clearanceLevel: newUser.clearanceLevel,
        avatar: newUser.avatar,
      },
      token,
    });

    response.cookies.set({
      name: "resq_session_token",
      value: token,
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Registration internal error" }, { status: 500 });
  }
}
