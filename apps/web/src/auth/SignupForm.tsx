"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "@ft/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { signup } from "./api";
import { applyApiError } from "./apply-api-error";
import { useAuth } from "./AuthProvider";

const SignupFormSchema = SignupSchema.extend({
  acceptTerms: z.boolean().refine((accepted) => accepted, "Please accept the terms to continue"),
});

type SignupFormValues = z.infer<typeof SignupFormSchema>;

export function SignupForm() {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const { register, handleSubmit, setError, formState } = useForm<SignupFormValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: { email: "", password: "", acceptTerms: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Only the account fields travel to the API; the consent is this form's business.
    const credentials = { email: values.email, password: values.password };
    try {
      await signup(credentials);
      await refresh(); // the cookie is set: update the header
      router.push("/");
    } catch (error) {
      toast(applyApiError(error, setError), "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={formState.errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={formState.errors.password?.message}
        {...register("password")}
      />
      <p className="text-sm text-muted">
        At least 15 characters. A short sentence is easier to remember than a jumble.
      </p>
      <TermsCheckbox
        field={register("acceptTerms")}
        error={formState.errors.acceptTerms?.message}
      />
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function TermsCheckbox({ field, error }: { field: UseFormRegisterReturn; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-1"
          aria-invalid={error ? true : undefined}
          {...field}
        />
        <span>
          I accept the{" "}
          <Link href="/terms" className="text-ink underline underline-offset-2">
            terms
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-2">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
