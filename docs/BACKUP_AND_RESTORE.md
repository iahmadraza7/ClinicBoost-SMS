# Backup and restore

Written for the owner. The database holds every enquiry, draft, knowledge base
entry, audit row and queue job. If the disk dies, this is what you rebuild from.

## What is backed up

A plain SQL dump of the whole `clinicboost` Postgres database: all clinics, all
messages, all knowledge base content, audit log, usage counters and pg-boss
queue tables. The dump is compressed with gzip.

Not included in the dump (you must keep separately):

| Item | Where |
|---|---|
| `.env` secrets | Password manager or secure notes. Never in git. |
| Converted skill files | `knowledge-source/converted/` on the server host |
| TLS certificates | Caddy renews automatically in Docker volume `caddy_data` |
| Mobile Message / Anthropic / Resend accounts | Provider consoles |

## Where backups live

On the server, in `/opt/clinicboost/backups/`:

```
backups/clinicboost-2026-09-01.sql.gz
backups/clinicboost-2026-08-31.sql.gz
...
```

Seven daily files are kept. Older ones are deleted automatically.

The directory is on the same disk as the database. Copy the newest file off
the server regularly — to your laptop, Google Drive, or another machine. A backup
that only exists on the server does not help if the server is lost.

Suggested copy (from your laptop, after SSH works):

```bash
scp -i ~/.ssh/reflex_sms USER@168.144.174.105:/opt/clinicboost/backups/clinicboost-$(date +%Y-%m-%d).sql.gz .
```

## Nightly backup (server setup)

Scripts are in the repo:

| Script | Purpose |
|---|---|
| `scripts/backup-db.sh` | Dump + gzip + seven-day rotation |
| `scripts/restore-db.sh` | Restore from a file |
| `scripts/test-restore.sh` | Safe end-to-end test (scratch database only) |

Install the cron job once on the server:

```bash
sudo cp /opt/clinicboost/deploy/clinicboost-backup.cron /etc/cron.d/clinicboost-backup
sudo chmod 644 /etc/cron.d/clinicboost-backup
```

That runs `./scripts/backup-db.sh` every night at **03:00** server time and
appends to `/var/log/clinicboost-backup.log`.

Run a backup manually any time:

```bash
cd /opt/clinicboost
./scripts/backup-db.sh
```

From the project root with npm:

```bash
npm run db:backup
```

## Restore test (already run)

Before handover, a full backup → scratch restore → verify → drop cycle was run
against the local Docker database. This proves the scripts work; it did not
touch a production database.

| Field | Value |
|---|---|
| Date (UTC) | 2026-09-01T09:37Z |
| Command | `bash scripts/test-restore.sh` |
| Backup size | 50,493 bytes (schema + data) |
| Scratch database | `clinicboost_restore_test` |
| After restore | 10 public tables, 2 clinics |
| Result | **PASSED** — scratch database dropped after verify |

Re-run the test yourself after any change to the backup scripts, or on the
server after first install:

```bash
cd /opt/clinicboost
npm run db:restore-test
```

Safe on a live server: the live database is only read. Restore goes into
`clinicboost_restore_test`, then that database is dropped.

## Restoring to a scratch database (practice)

Use this to confirm a backup file is good without touching live data.

```bash
cd /opt/clinicboost
./scripts/restore-db.sh --file backups/clinicboost-2026-09-01.sql.gz
```

Default target is `clinicboost_restore_test`. To inspect:

```bash
docker compose exec db psql -U clinicboost -d clinicboost_restore_test -c "SELECT slug, name FROM clinics;"
```

Drop when finished:

```bash
docker compose exec db psql -U clinicboost -d postgres -c "DROP DATABASE clinicboost_restore_test;"
```

## Restoring production (disaster recovery)

Only when the live database is corrupt or lost. This **replaces** the current
database. Stop traffic first.

1. Copy a backup file onto the server if it is not already in `backups/`.
2. Put the app in maintenance mode: set `GLOBAL_KILL_SWITCH=true` in `.env` and
   `docker compose up -d app worker` (or stop app and worker).
3. Restore:

   ```bash
   cd /opt/clinicboost
   ./scripts/restore-db.sh --file backups/clinicboost-2026-09-01.sql.gz --production
   ```

   The script stops `app` and `worker`, drops and recreates the `clinicboost`
   database, loads the dump, verifies table count, then starts `app` and
   `worker` again.

4. Sign in at the dashboard. Check health rows, one clinic, one queued draft
   if you expect them.
5. Turn `GLOBAL_KILL_SWITCH` back to `false` when satisfied.
6. Record what happened in your notes (date, which backup file, why).

You will lose any data written **after** the backup timestamp. That is why
nightly backups and off-server copies matter.

## If Postgres will not start

Often disk full. See `docs/RUNBOOK.md` (Disk row). Free space with
`docker builder prune -af`, then restart:

```bash
docker compose up -d db
```

If the data volume is intact, Postgres may come back without a restore. If the
volume is corrupted, restore from the newest good backup as above.

## Checklist

| Task | How often |
|---|---|
| Nightly `backup-db.sh` via cron | Automatic |
| Copy newest `.sql.gz` off server | Weekly, or before risky changes |
| Run `npm run db:restore-test` | After script changes; once after server install |
| Confirm backup log has no errors | Monthly: `tail /var/log/clinicboost-backup.log` |
