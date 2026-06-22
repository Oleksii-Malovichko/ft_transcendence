import type { CookieOptions, Response } from "express";

export const SESSION_COOKIE = "session";

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // page JavaScript can't read it, so an XSS bug can't steal it
  secure: true, // HTTPS only (Chrome and Firefox also accept it on http://localhost)
  sameSite: "lax", // not sent when another site POSTs to us: blocks CSRF
  path: "/",
};

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: SESSION_TTL_SECONDS * 1000 });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
}