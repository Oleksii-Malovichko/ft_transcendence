import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

const ROOT_ENV_FILE = "../../.env";
if (existsSync(ROOT_ENV_FILE)) {
  process.loadEnvFile(ROOT_ENV_FILE); // never overwrites variables already set
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // `prisma generate` never connects, so a missing URL must not break it
    // (e.g. in a Docker build). Commands that connect fail clearly if empty.
    url: process.env.DATABASE_URL ?? "",
  },
});
