import type { PublicUser } from "@ft/core";
import type { User } from "../generated/prisma/client.js";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: avatarUrlFor(user.id),
  };
}

/** Where a user's avatar is served from; the route answers even without an upload. */
export function avatarUrlFor(userId: number): string {
  return `/api/users/${userId}/avatar`;
}
