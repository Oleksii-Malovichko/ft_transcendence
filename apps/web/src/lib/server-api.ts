import { cookies } from "next/headers";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store", // answers depend on who is asking
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}