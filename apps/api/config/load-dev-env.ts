import { existsSync } from "node:fs";

const ROOT_ENV_FILE = "../../.env";

export function loadDevEnv(path: string = ROOT_ENV_FILE): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
