import { existsSync } from "node:fs";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.string().startsWith("postgresql://", "must start with postgresql://"),
});

export type Env = Readonly<z.infer<typeof EnvSchema>>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const details = z.prettifyError(result.error);
    throw new Error(`Invalid environment variables:\n${details}\n(see .env.example)`);
  }
  return Object.freeze(result.data);
}

const ROOT_ENV_FILE = "../../.env";

export function loadDevEnvFile(path: string = ROOT_ENV_FILE): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
