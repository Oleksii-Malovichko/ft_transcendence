#!/bin/sh

set -eu

./node_modules/.bin/prisma migrate deploy

if [ -f "dist/apps/api/main.js" ]; then
  exec node --enable-source-maps dist/apps/api/main.js
else
  exec node --enable-source-maps dist/main.js
fi