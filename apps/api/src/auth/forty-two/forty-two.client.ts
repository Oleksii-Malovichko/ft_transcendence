import { UnauthorizedException } from "@nestjs/common";
import type { FortyTwoSettings } from "./authorize-url.js";

export interface TokenSettings extends FortyTwoSettings {
  clientSecret: string;
}

export interface FortyTwoProfile {
  id: number;
  login: string;
  email: string;
}

export async function exchangeCode(settings: TokenSettings, code: string): Promise<string> {
  const response = await fetch(new URL("/oauth/token", settings.apiUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      redirect_uri: settings.redirectUri,
      code,
    }),
  });
  const body = (await response.json().catch(() => null)) as { access_token?: string } | null;
  if (!response.ok || !body?.access_token) {
    throw new UnauthorizedException("42 did not accept this sign-in");
  }
  return body.access_token;
}

export async function fetchProfile(
  settings: FortyTwoSettings,
  accessToken: string,
): Promise<FortyTwoProfile> {
  const response = await fetch(new URL("/v2/me", settings.apiUrl), {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body = (await response.json().catch(() => null)) as Partial<FortyTwoProfile> | null;
  if (!response.ok || typeof body?.id !== "number" || !body.email || !body.login) {
    throw new UnauthorizedException("Could not read the 42 profile");
  }
  return { id: body.id, login: body.login, email: body.email.toLowerCase() };
}
