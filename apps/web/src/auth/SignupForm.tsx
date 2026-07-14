"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SignupInput, SignupSchema } from "@ft/core";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { signup } from "./api";
import { applyApiError } from "./apply-api-error";
import { useAuth } from "./AuthProvider";

export function SignupForm() {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const { register, handleSubmit, setError, formState } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup(values);
      await refresh(); 
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
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}