import { describe, expect, it } from "vitest";
import { authorizeUrl } from "./authorize-url.js";

const SETTINGS = {
  clientId: "u-s4t-abc",
  redirectUri: "https://localhost/api/auth/42/callback",
  apiUrl: "https://api.intra.42.fr",
};

describe("authorizeUrl", () => {
  it("asks 42 for a code, and carries our state", () => {
    const url = new URL(authorizeUrl(SETTINGS, "state-123"));
    expect(url.origin + url.pathname).toBe("https://api.intra.42.fr/oauth/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe(SETTINGS.clientId);
    expect(url.searchParams.get("state")).toBe("state-123");
  });

  it("sends the redirect address 42 will come back to", () => {
    const url = new URL(authorizeUrl(SETTINGS, "x"));
    expect(url.searchParams.get("redirect_uri")).toBe(SETTINGS.redirectUri);
  });
});
