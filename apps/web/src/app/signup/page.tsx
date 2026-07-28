import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/auth/SignupForm";
import { FortyTwoButton } from "@/auth/FortyTwoButton";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <FortyTwoButton />
      <p className="text-center text-sm text-muted">or</p>
      <Card>
        <SignupForm />
      </Card>
      <p className="text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
