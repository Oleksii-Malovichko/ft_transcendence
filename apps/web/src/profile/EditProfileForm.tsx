"use client";
import { type ProfileUpdate, ProfileUpdateSchema } from "@ft/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { applyApiError } from "@/auth/apply-api-error";
import { updateProfile } from "./api";

export function EditProfileForm({ displayName }: { displayName: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const { register, handleSubmit, setError, formState } = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: { displayName: displayName ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      await refresh();
      router.refresh();
      toast("Name saved");
    } catch (error) {
      toast(applyApiError(error, setError), "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Display name"
        autoComplete="nickname"
        error={formState.errors.displayName?.message}
        {...register("displayName")}
      />
      <p className="text-sm text-muted">
        3 to 20 characters. Other players see this, not your email.
      </p>
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}