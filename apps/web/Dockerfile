# syntax=docker/dockerfile:1

# ── build ───────────────────────────────────────────────────────────────────
FROM node:24-slim AS build
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 HUSKY=0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
# Lockfile first for layer caching (same idea as apps/api/Dockerfile).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile \
 && pnpm --filter @ft/core build \
 && pnpm --filter @ft/web build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:24-slim AS runtime
# HOSTNAME=0.0.0.0: listen on every interface. Docker sets HOSTNAME to the
# container id by default, and Next.js would then bind to that address only.
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
# The standalone folder mirrors the monorepo: server.js lives in apps/web/.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
# JS/CSS chunks are not inside standalone; they must sit right next to it.
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
# (If apps/web/public/ is created later, copy it to ./apps/web/public too.)
# Never run as root: 1000 is the base image's built-in "node" user.
USER 1000
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
