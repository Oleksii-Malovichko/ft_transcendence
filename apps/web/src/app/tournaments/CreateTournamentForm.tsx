"use client";

import { CreateTournamentSchema, type TournamentSize } from "@ft/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { applyApiError } from "@/auth/apply-api-error";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createTournament } from "./api";

const NameOnly = CreateTournamentSchema.pick({ name: true });
type NameOnly = { name: string };

export function CreateTournamentForm() {
  const router = useRouter();
  const toast = useToast();
  const [size, setSize] = useState<TournamentSize>(4);
  const { register, handleSubmit, setError, formState } = useForm<NameOnly>({
    resolver: zodResolver(NameOnly),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      const created = await createTournament({ name, size });
      router.push(`/tournaments/${created.id}`);
    } catch (error) {
      toast(applyApiError(error, setError), "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input label="Name" error={formState.errors.name?.message} {...register("name")} />
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>Players</span>
        {([4, 8] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={size === option}
            onClick={() => setSize(option)}
            className={`rounded-md border px-3 py-1 ${
              size === option ? "border-accent text-accent" : "border-edge hover:text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Opening…" : "Open tournament"}
      </Button>
    </form>
  );
}
