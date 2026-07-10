import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted">That address doesn&apos;t exist. It may have moved.</p>
      <Link href="/">
        <Button>Back to the home page</Button>
      </Link>
    </div>
  );
}
