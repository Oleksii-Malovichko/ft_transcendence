"use client";

import { Button } from "@/components/ui/Button";
import type { IncomingGameInvite } from "./useGameSocket";

export function GameInvitePrompt({
  invite,
  onAnswer,
}: {
  invite: IncomingGameInvite;
  onAnswer: (inviteId: string, accept: boolean) => void;
}) {
  return (
    <section className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-panel p-3">
      <p>{invite.inviter} invited you to a game.</p>
      <div className="flex gap-2">
        <Button onClick={() => onAnswer(invite.inviteId, true)}>Accept</Button>
        <Button variant="ghost" onClick={() => onAnswer(invite.inviteId, false)}>
          Decline
        </Button>
      </div>
    </section>
  );
}
