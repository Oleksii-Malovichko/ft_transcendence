"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, LoginSchema } from "@ft/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { login } from "./api";
import { applyApiError } from "./apply-api-error";
import { useAuth } from "./AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const toast = useToast();
  const { refresh } = useAuth();
  const { register, handleSubmit, setError, formState } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      await refresh();
      router.push("/");
      router.push(next);
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
        autoComplete="current-password"
        error={formState.errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}