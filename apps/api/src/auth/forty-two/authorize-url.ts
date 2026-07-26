export interface FortyTwoSettings {
  clientId: string;
  redirectUri: string;
  apiUrl: string;
}

export function authorizeUrl(settings: FortyTwoSettings, state: string): string {
  const url = new URL("/oauth/authorize", settings.apiUrl);
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("redirect_uri", settings.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "public");
  url.searchParams.set("state", state);
  return url.toString();
}
