#!/bin/sh

set -eu

./node_modules/.bin/prisma migrate deploy
exec node --enable-source-maps dist/main.js