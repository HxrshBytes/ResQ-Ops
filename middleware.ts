import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security Protected Routes & Role Permissions Matrix
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/dashboard": ["COMMANDER", "SECURITY_AUDITOR"],
  "/responder": ["RESPONDER", "COMMANDER"],
  "/security": ["SECURITY_AUDITOR", "COMMANDER"],
};

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // 1. Inject HTTP Security Headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // 2. Check protected route access
  const token = req.cookies.get("resq_session_token")?.value;

  const matchedRoute = Object.keys(PROTECTED_ROUTES).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (matchedRoute) {
    const requiredRoles = PROTECTED_ROUTES[matchedRoute];

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("reason", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    try {
      const [base64Payload] = token.split(".");
      if (!base64Payload) throw new Error("Invalid token format");

      const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
      const payload = JSON.parse(jsonStr);

      if (Date.now() > payload.exp) {
        // Token expired
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        loginUrl.searchParams.set("reason", "expired");
        const redirectRes = NextResponse.redirect(loginUrl);
        redirectRes.cookies.delete("resq_session_token");
        return redirectRes;
      }

      if (!requiredRoles.includes(payload.role)) {
        // Role insufficient clearance
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        loginUrl.searchParams.set("reason", "forbidden");
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete("resq_session_token");
      return redirectRes;
    }
  }

  // 3. If accessing /login or /login while already authenticated
  if ((pathname === "/login" || pathname === "/login") && token) {
    try {
      const [base64Payload] = token.split(".");
      const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
      const payload = JSON.parse(jsonStr);

      if (payload && Date.now() <= payload.exp) {
        const queryRedirect = req.nextUrl.searchParams.get("redirect");
        const reason = req.nextUrl.searchParams.get("reason");

        if (!reason) {
          let dest = queryRedirect && queryRedirect !== "/login" && queryRedirect !== "/login" ? queryRedirect : "";

          if (!dest) {
            dest =
              payload.role === "RESPONDER"
                ? "/responder"
                : payload.role === "SECURITY_AUDITOR"
                ? "/security"
                : payload.role === "CITIZEN"
                ? "/citizen"
                : "/dashboard";
          }

          const targetMatchedRoute = Object.keys(PROTECTED_ROUTES).find(
            (route) => dest === route || dest.startsWith(`${route}/`)
          );

          if (targetMatchedRoute && !PROTECTED_ROUTES[targetMatchedRoute].includes(payload.role)) {
            dest =
              payload.role === "RESPONDER"
                ? "/responder"
                : payload.role === "SECURITY_AUDITOR"
                ? "/security"
                : "/citizen";
          }

          if (dest && dest !== pathname) {
            return NextResponse.redirect(new URL(dest, req.url));
          }
        }
      }
    } catch {
      // Invalid token, allow login
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
