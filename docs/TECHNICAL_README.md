# Technical README

Enough detail for the owner to brief a developer, or for a developer to deploy
and maintain ClinicBoost SMS without reading the whole codebase first.

Live server: DigitalOcean Sydney, `168.144.174.105`, app at
https://reply.clinicboost.com.au. Code lives in `/opt/clinicboost` on the
server.

## What runs where

```
Browser / landing page
        │
        ▼
    Caddy (TLS, ports 80/443)
        │
        ▼
    Next.js app (port 3000, loopback only)
        │                    │
        ▼                    ▼
    Postgres 16          pg-boss queue
        ▲                    │
        │                    ▼
        └────────────  Worker process
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              Anthropic   Mobile Message  Resend
              (drafts)    (SMS)           (email alerts)
```

Four Docker containers from `docker-compose.yml`:

| Service | Role |
|---|---|
| `db` | Postgres 16. Data volume `pgdata`. Port 5432 on loopback only. |
| `app` | Next.js dashboard, widget API, webhooks. Migrations run on boot. |
| `worker` | pg-boss jobs: draft replies, send SMS, email alerts, unattended sweep. |
| `caddy` | Automatic HTTPS for `reply.clinicboost.com.au`. |

There is no Redis, no vector database, no separate microservices. The server
is 4GB RAM / 8.7GB disk — watch the Disk row on the health panel.

## Data and tenancy

One Postgres database, shared schema, eleven clinics, one operator login.

Every business table has a non-null `clinic_id`. All reads and writes go
through `src/server/repo/` with `clinicId` as the first argument. Route
handlers and worker jobs must not import the Drizzle client directly (enforced
by ESLint).

Conversation identity is `(clinic_id, mobile_number)`. Threads are never
reset.

## The validation layer

This is the core of the product. The model proposes an SMS; deterministic
code decides whether it may auto-send.

Flow:

1. Lead submits widget or texts in → message persisted → worker enqueues
   `draft-reply`.
2. Worker loads the clinic's **active** knowledge base and calls Claude.
3. Model returns JSON only: draft text, claims (sentence → `source_id`),
   confidence, optional offer match.
4. **Validator** runs. Any failure → draft stays in queue with reason chips.
5. All checks pass → SMS job enqueued (unless kill switch or opt-out).

Checks, in order (see `docs/SCHEMA.md` for codes):

1. JSON parses
2. Every `source_id` resolves to a KB **fact** (not an instruction)
3. Every sentence has a claim
4. Prices string-match the KB
5. Treatment intervals string-match the KB
6. Suitability / contraindication language maps to the KB
7. URLs exist verbatim in the KB
8. Blocked terms (Schedule 4 baseline + per-clinic list)
9. Contact has not opted out
10. Self-confidence ≥ clinic threshold
11. Kill switch off
12. Segment count within cap

The model's confidence is **not** the gate on its own. Grounding is. A draft
that cites a behaviour instruction fails `INSTRUCTION_CITED`. A price not in
the KB fails `PRICE_UNVERIFIED` even at 100% confidence.

Unit tests live in `src/server/validation/`. They use Beauty Soiree seed data.

## Prompt structure

Claude receives:

- System instructions (Australian SMS rules, compliance)
- `# CLINIC BEHAVIOUR` — instruction entries, no citable ids
- `# CLINIC KNOWLEDGE BASE` — fact entries with stable ids like
  `beauty-soiree.hifu-499.price`
- Conversation history and the latest customer message

Prompt caching applies to the knowledge base section.

## Secrets and environment

Secrets live in **`.env` on the server only**. Never commit `.env` or
`.env.local`. The Docker image does not contain them; Compose injects via
`env_file: .env`.

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs the operator session cookie |
| `OPERATOR_EMAIL` / `OPERATOR_PASSWORD_HASH` | Single login |
| `DATABASE_URL`, `POSTGRES_*` | Postgres (in containers, host is `db`) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Draft generation |
| `SMS_PROVIDER` | `console` (log only) or `mobile_message` (live) |
| `MOBILE_MESSAGE_*` | SMS API and webhook signature |
| `SHARED_NUMBER_CLINIC_SLUG` | Routes shared test number inbound |
| `RESEND_API_KEY`, `RESEND_FROM` | Operator email alerts |
| `OPERATOR_NOTIFY_EMAIL`, `OPERATOR_NOTIFY_MOBILE` | Where alerts go |
| `GLOBAL_KILL_SWITCH` | Stops all outbound SMS when `true` |
| `MAX_SEGMENTS_PER_DRAFT` | SMS length cap (default 3 segments) |
| `APP_URL` | `https://reply.clinicboost.com.au` in production |

Generate a password hash on a trusted machine:

```bash
npm run hash-password
```

Rotate `AUTH_SECRET` to log everyone out. Rotate API keys in the provider
consoles; update `.env`; `docker compose up -d app worker`.

Client content (`knowledge-source/converted/`) is gitignored. Copy
`beauty-soiree.md` onto the server for seeding; it is mounted read-only into
the app container.

## Deploying an update

On the server:

```bash
ssh -i ~/.ssh/reflex_sms -o IdentitiesOnly=yes USER@168.144.174.105
cd /opt/clinicboost
git pull
docker compose up -d --build
docker builder prune -af
```

The app container runs migrations before serving traffic (`docker-entrypoint.sh`
→ `dist/migrate.cjs`). No separate migrate step.

After deploy, the operator signs in again (old session cookies are expired on
redirect to login).

**Disk:** `docker builder prune -af` after every successful build. The build
cache, not old images, fills the 8.7GB volume. See the runbook.

**Seed** (Beauty Soiree only, when skill file changed):

```bash
docker compose exec app node dist/seed.cjs
```

**Nightly backup:** install `deploy/clinicboost-backup.cron`. See
`docs/BACKUP_AND_RESTORE.md`.

## Local development

```bash
cp .env.example .env.local   # DATABASE_URL host localhost
cp .env.example .env         # DATABASE_URL host db, for compose
npm install
docker compose up db -d
npm run db:migrate
npm run db:seed              # needs knowledge-source/converted/beauty-soiree.md
npm run dev                  # terminal 1
npm run worker:dev           # terminal 2
```

Tests: `npm test`. Typecheck: `npm run typecheck`.

## Repository layout

```
src/app/           Next.js UI, widget route, webhooks
src/server/repo/   All database access, clinic-scoped
src/server/validation/   Deterministic draft gate (tested)
src/server/ai/       Prompt + Anthropic calls
src/server/sms/      SMS adapter (Mobile Message)
src/server/notify/   Email/SMS alerts (no PII in payload)
src/worker/          Background jobs
drizzle/           SQL migrations (committed, applied on deploy)
scripts/           backup-db.sh, restore-db.sh, checks, webhooks
deploy/            Example cron for backups
docs/              Operator guide, runbook, this file, backup procedure
```

## Schema changes

Edit `src/server/db/schema.ts`, then:

```bash
npm run db:generate    # writes drizzle/NNNN_*.sql
npm run db:migrate     # local
git commit migration + schema
```

Never edit a migration that has already run in production. Add a new one.

## Compliance constraints (non-negotiable)

- Schedule 4 medicines must not appear in advertising copy (blocked terms).
- Notification emails/SMS: clinic name + dashboard link only (Resend stores
  account data in the US).
- Enquiry text and mobile numbers stay in Sydney (Postgres on the droplet).
- Inbound enquiry implies consent to reply; opt-out checked before every send.

## Handover documents

| File | Audience |
|---|---|
| `docs/OPERATOR_GUIDE.md` | Day-to-day use |
| `docs/RUNBOOK.md` | When something breaks |
| `docs/BACKUP_AND_RESTORE.md` | Backups and disaster recovery |
| `docs/SCHEMA.md` | Tables and validator codes |
| `docs/DECISIONS.md` | Client agreements |
