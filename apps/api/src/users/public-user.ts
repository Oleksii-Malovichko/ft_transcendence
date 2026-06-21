import type { PublicUser } from "@ft/core";
import type { User } from "../generated/prisma/client.js";

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email };
}