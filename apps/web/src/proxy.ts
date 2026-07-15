import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session";
const PRIVATE_PREFIXES = ["/profile", "/settings"];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isPrivate || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export default proxy;

export const config = { matcher: ["/profile/:path*", "/settings/:path*"] };