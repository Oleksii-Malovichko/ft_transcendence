import type { LoginInput, MeResponse, PublicUser, SignupInput } from "@ft/core";
import { apiFetch } from "@/lib/api";

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