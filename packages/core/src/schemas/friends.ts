import { z } from "zod";
import { DisplayNameSchema } from "./profile.js";

export const AddFriendSchema = z.object({ displayName: DisplayNameSchema });
export type AddFriend = z.infer<typeof AddFriendSchema>;

export interface Friend {
  id: number;
  displayName: string | null;
  avatarUrl: string;
  /** True while they have at least one page open. */
  online: boolean;
}
