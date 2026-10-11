#!/bin/sh

set -eu

MIGRATION_PATH="prisma/migrations"
if [ ! -d "$MIGRATION_PATH" ] || [ -z "$(ls -A $MIGRATION_PATH 2>/dev/null)" ]; then
  echo "No migrations found in prisma/migrations." >&2
  echo "Generating initial migration automatically..." >&2
  npx prisma migrate dev --name init --skip-seed --accept-data-loss || true
fi

./node_modules/.bin/prisma migrate deploy || npx prisma migrate deploy || true

if [ -f "dist/apps/api/main.js" ]; then
  exec node --enable-source-maps dist/apps/api/main.js
else
  exec node --enable-source-maps dist/main.js
fi