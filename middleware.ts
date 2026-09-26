import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

/**
 * SABYR Middleware
 *
 * Protects /admin routes using cryptographic JWT verification (HS256 via `jose`).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;

    if (sessionToken) {
      const payload = await verifySessionToken(sessionToken);
      if (payload && payload.role === "ADMIN") {
        return NextResponse.next();
      }
    }

    // In development mode, allow /admin access and set dev bypass cookie
    // so admin API endpoints work smoothly during local testing
    if (process.env.NODE_ENV !== "production") {
      const res = NextResponse.next();
      if (req.cookies.get("sabyr-admin-dev")?.value !== "1") {
        res.cookies.set("sabyr-admin-dev", "1", {
          path: "/",
          sameSite: "lax",
        });
      }
      return res;
    }

    // In production, require valid ADMIN JWT session
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/account";
    loginUrl.searchParams.set("auth", "admin_required");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
