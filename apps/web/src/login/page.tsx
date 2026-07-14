import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/auth/LoginForm";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <Card>
        <LoginForm />
      </Card>
      <p className="text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-2">
          Create one
        </Link>
      </p>
    </div>
  );
}