import type { Friend } from "@ft/core";
import { apiFetch } from "@/lib/api";

export function fetchFriends(): Promise<Friend[]> {
  return apiFetch<Friend[]>("/users/me/friends");
}

export function addFriend(displayName: string): Promise<Friend> {
  return apiFetch<Friend>("/users/me/friends", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
}

export function removeFriend(id: number): Promise<void> {
  return apiFetch<void>(`/users/me/friends/${id}`, { method: "DELETE" });
}
