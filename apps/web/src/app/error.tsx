"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted">The page could not be displayed. You can try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
