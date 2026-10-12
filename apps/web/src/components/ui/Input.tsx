"use client";

import { type ComponentProps, useId } from "react";

export type InputProps = ComponentProps<"input"> & { label: string; error?: string };

export function Input({ label, error, className = "", ...props }: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-md border bg-surface px-3 py-2 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${error ? "border-danger" : "border-edge"} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
