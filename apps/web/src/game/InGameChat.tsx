"use client";

import type { GameChatMessage } from "@ft/core";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function InGameChat({
  messages,
  error,
  onSend,
}: {
  messages: GameChatMessage[];
  error: string | null;
  onSend: (body: string) => void;
}) {
  const [body, setBody] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = body.trim();
    if (!message) return;
    onSend(message);
    setBody("");
  };

  return (
    <section className="w-full rounded-lg border border-edge bg-panel p-3">
      <h2 className="mb-2 font-semibold">In-game chat</h2>
      <ol aria-live="polite" className="mb-3 flex max-h-40 min-h-12 flex-col gap-1 overflow-y-auto">
        {messages.map((message, index) => (
          <li key={`${message.createdAt}-${index}`} className="break-words text-sm">
            <span className="font-semibold">{message.sender}: </span>
            {message.body}
          </li>
        ))}
        {messages.length === 0 && (
          <li className="text-sm text-muted">Say hello to your opponent.</li>
        )}
      </ol>
      {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
      <form onSubmit={submit} className="flex items-end gap-2">
        <Input
          label="In-game message"
          value={body}
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button type="submit" disabled={!body.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
