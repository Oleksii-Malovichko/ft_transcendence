export default {
  // Code: lint first (blocks the commit on any error or warning),
  // then format. `--fix` auto-repairs what ESLint safely can.
  "*.{ts,tsx,js,jsx,mjs,cjs}": [
    "eslint --fix --max-warnings=0 --no-warn-ignored",
    "prettier --write",
  ],
  // Everything else Prettier understands: format only.
  "*.{json,jsonc,md,css,yml,yaml}": ["prettier --write"],
};
