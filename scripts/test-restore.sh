#!/usr/bin/env bash
# End-to-end backup and scratch restore test. Safe to run on a live server:
# the live database is only read; restore goes into clinicboost_restore_test.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "test-restore: ensuring db container is up"
docker compose up db -d
docker compose exec db pg_isready -U "${POSTGRES_USER:-clinicboost}" -d "${POSTGRES_DB:-clinicboost}"

echo "test-restore: taking a fresh backup"
bash "$ROOT/scripts/backup-db.sh"

LATEST="$(ls -1t "$ROOT/backups"/clinicboost-*.sql.gz 2>/dev/null | head -1)"
if [[ -z "$LATEST" ]]; then
  echo "test-restore: no backup file found in backups/" >&2
  exit 1
fi

echo "test-restore: restoring $LATEST into scratch database"
bash "$ROOT/scripts/restore-db.sh" --file "$LATEST" --scratch

echo "test-restore: dropping scratch database"
docker compose exec -T db psql -U "${POSTGRES_USER:-clinicboost}" -d postgres -v ON_ERROR_STOP=1 -qc \
  "DROP DATABASE IF EXISTS clinicboost_restore_test;"

echo "test-restore: PASSED at $(date -u +"%Y-%m-%dT%H:%MZ")"
