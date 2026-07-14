import type { MeResponse, PublicUser } from "@ft/core";
import { cookies } from "next/headers";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export async function currentUser(): Promise<PublicUser | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store", 
    });
    if (!response.ok) return null;
    const { user } = (await response.json()) as MeResponse;
    return user;
  } catch {
    return null;
  }
}