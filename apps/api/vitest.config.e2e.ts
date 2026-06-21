import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@ft/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
   },
  },
  test: {
    include: ["test/**/*.e2e-spec.ts"],
    environment: "node",
  },
});
