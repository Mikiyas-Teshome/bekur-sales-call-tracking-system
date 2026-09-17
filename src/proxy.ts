import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/forgot-password", "/reset-password", "/activate", "/session-expired"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const sessionCookie = request.cookies.get("authjs.session-token") ?? request.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
