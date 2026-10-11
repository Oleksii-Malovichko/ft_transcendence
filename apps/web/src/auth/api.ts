import type { LoginInput, MeResponse, PublicUser, SignupInput } from "@ft/core";
import { apiFetch } from "@/lib/api";

/** The logged-in user, or null for a guest (the API answers 200 either way). */
export async function fetchMe(): Promise<PublicUser | null> {
  const { user } = await apiFetch<MeResponse>("/auth/me");
  return user;
}

export async function signup(input: SignupInput): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return user;
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return user;
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
