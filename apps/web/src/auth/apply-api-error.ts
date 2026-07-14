import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api";

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (!(error instanceof ApiError)) {
    return "Could not reach the server. Please try again.";
  }
  for (const [field, messages] of Object.entries(error.fields ?? {})) {
    const first = messages?.[0];
    if (first) {
      setError(field as Path<T>, { message: first });
    }
  }
  return error.message;
}