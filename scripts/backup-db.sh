#!/usr/bin/env bash
# Nightly Postgres backup. Keeps seven daily dumps in ./backups/.
# Run from the project root (/opt/clinicboost on the server).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
STAMP="$(date +%Y-%m-%d)"
FILE="$BACKUP_DIR/clinicboost-${STAMP}.sql.gz"

if [[ ! -f docker-compose.yml ]]; then
  echo "backup-db: docker-compose.yml not found in $ROOT" >&2
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-clinicboost}"
POSTGRES_DB="${POSTGRES_DB:-clinicboost}"

mkdir -p "$BACKUP_DIR"

echo "backup-db: dumping $POSTGRES_DB to $FILE"
docker compose exec -T db pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-acl \
  | gzip -9 > "$FILE"

echo "backup-db: removing dumps older than ${RETAIN_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'clinicboost-*.sql.gz' -mtime +"$RETAIN_DAYS" -delete

BYTES="$(wc -c < "$FILE" | tr -d ' ')"
echo "backup-db: done ($BYTES bytes, kept last ${RETAIN_DAYS} days in $BACKUP_DIR)"
