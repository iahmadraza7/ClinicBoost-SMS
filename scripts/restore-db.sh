#!/usr/bin/env bash
# Restore a pg_dump backup. Default target is a scratch database for testing.
# Production restore requires --production and stops app + worker first.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="scratch"
BACKUP_FILE=""
TARGET_DB=""
PRODUCTION=false

usage() {
  cat <<'EOF'
Usage:
  ./scripts/restore-db.sh --file backups/clinicboost-2026-09-01.sql.gz
  ./scripts/restore-db.sh --file backups/clinicboost-2026-09-01.sql.gz --production

  --file PATH       Backup to restore (required). May be .sql.gz or plain .sql.
  --scratch         Restore into clinicboost_restore_test (default).
  --production      Restore into the live database. Stops app and worker first.
  --target NAME     Database name (default: clinicboost_restore_test, or POSTGRES_DB
                    when --production is set).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --scratch)
      MODE="scratch"
      shift
      ;;
    --production)
      PRODUCTION=true
      MODE="production"
      shift
      ;;
    --target)
      TARGET_DB="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "restore-db: unknown argument $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$BACKUP_FILE" ]]; then
  echo "restore-db: --file is required" >&2
  usage >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "restore-db: backup not found: $BACKUP_FILE" >&2
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

if [[ "$PRODUCTION" == true ]]; then
  TARGET_DB="${TARGET_DB:-$POSTGRES_DB}"
  echo "restore-db: PRODUCTION restore into $TARGET_DB"
  echo "restore-db: stopping app and worker"
  docker compose stop app worker
  docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$TARGET_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "$TARGET_DB";
CREATE DATABASE "$TARGET_DB";
SQL
else
  TARGET_DB="${TARGET_DB:-clinicboost_restore_test}"
  echo "restore-db: scratch restore into $TARGET_DB"
  docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$TARGET_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "$TARGET_DB";
CREATE DATABASE "$TARGET_DB";
SQL
fi

echo "restore-db: loading $BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 -q
else
  docker compose exec -T db psql -U "$POSTGRES_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 -q < "$BACKUP_FILE"
fi

echo "restore-db: verifying"
TABLES="$(
  docker compose exec -T db psql -U "$POSTGRES_USER" -d "$TARGET_DB" -Atqc \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
)"
CLINICS="$(
  docker compose exec -T db psql -U "$POSTGRES_USER" -d "$TARGET_DB" -Atqc \
    "SELECT COUNT(*) FROM clinics;" 2>/dev/null || echo 0
)"

echo "restore-db: public tables=$TABLES clinics=$CLINICS"

if [[ "$TABLES" -lt 5 ]]; then
  echo "restore-db: expected at least five public tables after restore" >&2
  exit 1
fi

if [[ "$PRODUCTION" == true ]]; then
  echo "restore-db: starting app and worker"
  docker compose up -d app worker
fi

echo "restore-db: done ($TARGET_DB)"
