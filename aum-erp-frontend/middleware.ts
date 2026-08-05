import { NextRequest, NextResponse } from "next/server";

// Pages reachable without a session. Everything else requires the auth_token
// cookie to be present. Actual verification (signature/expiry) still happens
// server-side on every API call via the backend's JwtAuthGuard — this is just
// a cheap presence check so logged-out visitors don't land on a blank/broken
// dashboard before their first API call 401s.
const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasSession = request.cookies.has("auth_token");

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
