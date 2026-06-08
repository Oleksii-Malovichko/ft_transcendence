# ── base: Node 24 LTS + pnpm (the version pinned in package.json) ──────────
FROM node:24-slim AS base

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 HUSKY=0
WORKDIR /repo

# ── build: install, compile, then extract a production-only folder ─────────
FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile \
 && pnpm --filter @ft/core build \
 && pnpm --filter @ft/api build

RUN pnpm --filter @ft/api deploy --prod --legacy /out

# ── runtime: the image that actually runs ──────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./

USER 1000
EXPOSE 3001
CMD ["node", "--enable-source-maps", "dist/main.js"]