"use client";

import type { Friend } from "@ft/core";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { addFriend, fetchFriends, removeFriend } from "./api";

const REFRESH_MS = 10000;

export function FriendsList({ initial }: { initial: Friend[] }) {
  const [friends, setFriends] = useState(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      setFriends(await fetchFriends());
    } catch {
      // A hiccup while polling is not worth a message.
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await refresh();
      setName("");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not reach the server", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Add somebody by their display name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button disabled={busy || name.length === 0} onClick={() => run(() => addFriend(name))}>
          Add
        </Button>
      </div>

      {friends.length === 0 ? (
        <p className="text-muted">Nobody yet. Add the last person you played.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center gap-3 border-b border-edge py-2">
              <Image
                src={friend.avatarUrl}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="rounded-full border border-edge"
              />
              <span className="flex-1">{friend.displayName ?? "Unnamed player"}</span>
              <span className={friend.online ? "text-sm text-accent" : "text-sm text-muted"}>
                {friend.online ? "online" : "offline"}
              </span>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => run(() => removeFriend(friend.id))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
