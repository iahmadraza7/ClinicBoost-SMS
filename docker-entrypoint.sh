#!/bin/sh
set -e

echo "applying migrations"
node dist/migrate.cjs

exec "$@"
