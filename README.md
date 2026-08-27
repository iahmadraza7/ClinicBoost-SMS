# ClinicBoost SMS

AI-assisted SMS enquiry and approval system for Australian aesthetic clinics.

## Start here

| File | What it is |
|---|---|
| `CLAUDE.md` | Project context. Read before writing code. |
| `docs/DECISIONS.md` | What was agreed with the client, and why. |
| `docs/SCHEMA.md` | Data model and validation failure codes. |
| `docs/CURSOR_KICKOFF.md` | Build sequence and prompts. |
| `docs/RUNBOOK.md` | Symptom, cause, fix. Written for the operator. |
| `.cursor/rules/` | Always-on rules Cursor loads automatically. |

## Setup

```bash
cp .env.example .env.local     # host processes, DATABASE_URL points at localhost
cp .env.example .env           # containers, DATABASE_URL host must be `db`
pip install python-docx
python scripts/convert-skills.py
npm install
docker compose up db -d
npm run db:migrate
npm run db:seed                # beauty-soiree, the end-to-end test clinic
npm run dev
npm run worker:dev             # second terminal
```

Submit a fake enquiry and it appears at http://localhost:3000/queue:

```bash
curl -X POST http://localhost:3000/api/widget/beauty-soiree \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sarah","mobile":"0405 111 222","question":"does the HIFU hurt?"}'
```

The worker must be running for a draft to appear.

After login, http://localhost:3000/ is the health panel (Claude key, SMS
credits, Resend domain, worker, last send, database) and this month's usage.
The audit log is `/audit`. Opt-outs are on each clinic. A queued draft has
Re-validate when failure chips look stale.

Clinics are at http://localhost:3000/clinics. Adding one copies the Schedule 4
blocked-terms baseline. The knowledge base for a clinic is at
`/clinics/[slug]/knowledge`. New and edited entries wait for review before
the model can use them. Per-treatment booking URLs upload as a CSV on that
page. The embeddable widget is `/widget.js`:

```html
<script src="http://localhost:3000/widget.js" data-clinic="beauty-soiree"></script>
```

## Operator login

One person, email and password, stored in the environment. There is no signup
and no second user.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run hash-password
```

Put the results in `.env` and `.env.local` as `AUTH_SECRET` and
`OPERATOR_PASSWORD_HASH`, plus `OPERATOR_EMAIL`. Restart the app.

`/` (and everything else) redirects to `/login` until you sign in. The
widget and the Mobile Message webhooks stay public on purpose: a lead submitting
a form, and a reply arriving from a phone, cannot wait for Ted to be at his
desk.

The session cookie lasts twelve hours and is signed with `AUTH_SECRET`. Rotating
that secret logs the operator out everywhere.

## Notifications

A pending draft (never an auto-send) emails the operator as soon as it lands
in the queue. An SMS follows only if it is still pending after
`clinics.unattended_minutes` (default 15). Both payloads are the clinic name
and a link to `/queue`. No question, no mobile, no name, no draft, no failure
code. Resend stores account data in the US; personal data stays in Sydney.

Set `OPERATOR_NOTIFY_EMAIL` and, if you want the SMS escalation,
`OPERATOR_NOTIFY_MOBILE`. Turn `notify_sms` on per clinic; it defaults off so
a misconfigured environment cannot spend the test credits. The SMS uses the
same send-sms job as a customer reply, so it counts on `usage_counters` and
stops when `GLOBAL_KILL_SWITCH` is on.

Leave `RESEND_API_KEY` empty to log the email instead of sending it, the same
idea as `SMS_PROVIDER=console`.

## Sending SMS

`SMS_PROVIDER` decides whether anything actually leaves the building.

| Value | Behaviour |
|---|---|
| `console` (default) | Replies are written to the worker log. Nothing is sent, nothing is spent. |
| `mobile_message` | Live. A validated draft sends a real SMS and spends a credit. |

Credentials alone never cause a send, so the account can be configured well
before anyone is ready to go live.

```bash
node scripts/check-mobile-message.mjs   # credit balance and registered senders, read-only
node scripts/check-anthropic.mjs        # Claude key and model
```

### Webhooks

Point Mobile Message (Settings > API) at:

```
https://reply.clinicboost.com.au/api/webhooks/mobile-message/inbound
https://reply.clinicboost.com.au/api/webhooks/mobile-message/status
```

Generate a **Webhook Signing Secret** on the same page and put it in
`MOBILE_MESSAGE_WEBHOOK_SECRET`. Both endpoints reject every request without a
valid signature: they are public URLs that write to the database and trigger a
paid API call, so an unsigned request is both a data integrity problem and a way
to spend someone else's money.

To exercise them locally without a real message:

```bash
node scripts/post-test-webhook.mjs inbound "--message=how long do results last"
node scripts/post-test-webhook.mjs inbound --message=STOP
node scripts/post-test-webhook.mjs status "--message-id=<provider id>" --status=delivered
node scripts/post-test-webhook.mjs inbound --unsigned    # expect 400
node scripts/post-test-webhook.mjs inbound --tamper      # expect 401
```

### Inbound routing

Inbound messages are routed to a clinic by the number they arrived on
(`clinics.sms_number`). The Mobile Message test number is shared, so until the
first dedicated number is bought, `SHARED_NUMBER_CLINIC_SLUG` says which clinic
owns traffic on a number no clinic claims. Moving to per-clinic numbers is
setting `sms_number` and clearing that variable, not a rebuild.

## Deploy

```bash
ssh reflex                      # 168.144.174.105
cd /opt/clinicboost
git pull && docker compose up -d --build
```

The `app` container applies migrations on boot, before it serves traffic, so
there is no separate migrate step on deploy.

## Tests

```bash
npm test          # once
npm run test:watch
```

The validator is the module the client bought, so it carries the tests. They run
against the real Beauty Soiree prices, links and do-not-answer list, taken from
`src/server/seed/beauty-soiree.ts`, which asserts on load that it has not
drifted from the converted skill file.

## Schema changes

```bash
# edit src/server/db/schema.ts, then
npm run db:generate            # writes drizzle/NNNN_*.sql
npm run db:migrate             # applies it locally
```

Migrations are committed. Never edit one that has already been applied on the
server; add a new one.

## Layout

```
src/
  app/                  Next.js routes, dashboard, widget + webhook APIs
  lib/                  pure helpers safe on both server and client
  server/
    db/                 Drizzle schema, client, migrate script
    repo/               data access, clinicId-scoped, only place importing db
    queue/              pg-boss instance and queue names
    widget/             public enquiry endpoint: CORS, rate limit, persistence
    compliance/         S4 blocked terms baseline
    seed/               beauty-soiree, transcribed from the converted skill file
    ai/                 prompt construction, Anthropic calls
    auth/               single-operator login. signed cookie, no user table.
    health/             dashboard checks: keys, credits, worker, last send
    validation/         deterministic gate. the core. tested carefully.
                        pure functions, no db. context is loaded and passed in.
    sms/                adapter interface + Mobile Message implementation
    notify/             Resend email, SMS alerts. never carries PII.
  worker/               pg-boss jobs
drizzle/                generated migrations, committed
knowledge-source/
  raw/                  client's .docx clinic files (gitignored)
  converted/            generated markdown + import report (gitignored)
```

The rule that nothing outside `src/server/repo/` may import the Drizzle client
is enforced by ESLint (`no-restricted-imports` in `eslint.config.mjs`), not by
memory.
