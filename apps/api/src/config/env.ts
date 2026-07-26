import { existsSync } from "node:fs";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Environment values are always text: coerce turns "3001" into 3001.
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.string().startsWith("postgresql://", "must start with postgresql://"),
  // Signs the session tokens (JWT). Whoever knows it can log in as anyone:
  // long, random, never committed. Generate one with: openssl rand -hex 32
  JWT_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -hex 32)"),
  // Where uploaded avatars are written. In Docker this is a volume, so the
  // images survive a rebuild of the image itself.
  UPLOADS_DIR: z.string().default("./uploads"),

  // Signing in with 42. All three are needed together; without them the
  // feature is simply switched off, so the project still runs for anyone
  // who has not registered an application on the 42 intranet.
  FORTY_TWO_CLIENT_ID: z.string().optional(),
  FORTY_TWO_CLIENT_SECRET: z.string().optional(),
  FORTY_TWO_REDIRECT_URI: z.string().optional(),
  // Overridable so the tests can point at a local stand-in for 42.
  FORTY_TWO_API_URL: z.string().default("https://api.intra.42.fr"),
  // Where the browser is sent back to after a sign-in.
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
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

// Local development: the API runs from apps/api, so the repo-root .env is two
// folders up. Inside Docker the file doesn't exist (Compose passes the
// variables), so nothing happens. Variables already set are never overwritten.
const ROOT_ENV_FILE = "../../.env";

export function loadDevEnvFile(path: string = ROOT_ENV_FILE): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
