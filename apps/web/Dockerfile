# ── build ───────────────────────────────────────────────────────────────────
FROM node:24-slim AS build
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 HUSKY=0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile \
 && pnpm --filter @ft/core build \
 && pnpm --filter @ft/web build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:24-slim AS runtime

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./

COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER 1000
EXPOSE 3000
CMD ["node", "apps/web/server.js"]