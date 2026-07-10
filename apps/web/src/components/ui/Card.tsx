import type { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-edge bg-panel p-5">
      {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
      <div className="text-muted">{children}</div>
    </section>
  );
}
