import type { MeResponse, PublicUser } from "@ft/core";
import { serverGet } from "@/lib/server-api";

export async function currentUser(): Promise<PublicUser | null> {
  const me = await serverGet<MeResponse>("/auth/me");
  return me?.user ?? null;
}
