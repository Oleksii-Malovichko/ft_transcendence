"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function MessageComposer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (body: string) => Promise<boolean>;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = body.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      if (await onSend(message)) setBody("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex items-end gap-2 border-t border-edge p-3"
    >
      <Input
        label="Message"
        value={body}
        maxLength={1000}
        onChange={(event) => setBody(event.target.value)}
        disabled={disabled || sending}
      />
      <Button type="submit" disabled={disabled || sending || body.trim().length === 0}>
        {sending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
