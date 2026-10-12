import type { ProfileUpdate, PublicUser } from "@ft/core";
import { apiFetch } from "@/lib/api";

export async function updateProfile(update: ProfileUpdate): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(update),
  });
  return user;
}

export async function uploadAvatar(file: File): Promise<PublicUser> {
  const body = new FormData();
  body.append("avatar", file);
  const { user } = await apiFetch<{ user: PublicUser }>("/users/me/avatar", {
    method: "POST",
    body,
  });
  return user;
}
