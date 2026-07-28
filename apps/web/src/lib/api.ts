import type { ApiErrorBody } from "@ft/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function apiUrl(path: string): string {
  return `${BASE_URL}/api${path}`;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    // Without this the browser would leave the session cookie at home.
    credentials: "include",
    headers: { "content-type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  // 204 (logout, deletions) has no body to parse.
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiError(
    response.status,
    body?.message ?? "Something went wrong. Please try again.",
    body?.fields,
  );
}
