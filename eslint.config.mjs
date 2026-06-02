import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default defineConfig([
  // ── Never lint generated or built files ────────────────────────────────────
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/coverage/**",
    "**/next-env.d.ts",
    "apps/api/src/generated/**", // Prisma client, re-created by `prisma generate`
  ]),

  // ── Recommended rules for all JavaScript and TypeScript ────────────────────
  js.configs.recommended,
  tseslint.configs.recommended,

  // ── Team rules (apply everywhere) ──────────────────────────────────────────
  {
    name: "team/code-size",
    rules: {
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 10],
      "no-console": "error",
    },
  },

  // ── Node.js code: backend, core, and root config files ─────────────────────
  {
    name: "node/globals",
    files: ["apps/api/**/*.ts", "packages/core/**/*.ts", "*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
  },

  // ── Tests: a describe() block is a list of cases, not logic ────────────────
  {
    name: "tests/relaxed-size",
    files: ["**/*.{test,spec,e2e-spec}.ts"],
    rules: { "max-lines-per-function": "off" },
  },
]);