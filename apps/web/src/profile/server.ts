import type { PublicProfile } from "@ft/core";
import { serverGet } from "@/lib/server-api";

export function fetchProfile(userId: number): Promise<PublicProfile | null> {
  return serverGet<PublicProfile>(`/users/${userId}`);
}