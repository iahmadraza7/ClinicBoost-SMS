# Runbook

Written for the operator. Symptom, cause, what to do. Expand this as the
product grows; the most likely real-world failure is a credential or account
issue, not code.

## Something has stopped working

Open https://reply.clinicboost.com.au/ first. The health panel is six rows:

| Row | Green means | If it is not green |
|---|---|---|
| Database | Postgres answered | The box or the database container is down |
| Anthropic | The Claude key was accepted | The key is missing, rotated, or the model name is wrong |
| Mobile Message | Credits remain | Test mode, no credits, or the API user/password is wrong |
| Resend | notify.clinicboost.com.au is verified | The key is missing or the domain is not verified |
| Worker | The every-minute sweep ran recently | `npm run worker:dev` locally, or the `worker` container on the server |
| Last send | An SMS actually left | Amber until the first real send. Not a failure on its own |

Fix the red or amber row before looking at code.

## I did not get an email when a draft hit the queue

1. Auto-sent drafts do not email. If the reply went out on its own, that is
   working as designed.
2. Check `OPERATOR_NOTIFY_EMAIL` is set on the server and that
   `clinics.notify_email` is on for that clinic.
3. If `RESEND_API_KEY` is empty, the worker logs the email instead of sending
   it. Look at the worker log for `[email:console]`.
4. The email body is only the clinic name and a link to the queue. It will
   never contain the customer's question or number. Open
   https://reply.clinicboost.com.au/queue to see the draft.

## I did not get an SMS after 15 minutes

1. `notify_sms` defaults to off. Turn it on for the clinic.
2. `OPERATOR_NOTIFY_MOBILE` must be set (E.164, e.g. `+614...`).
3. `GLOBAL_KILL_SWITCH=true` blocks the alert. The next sweep retries once
   it is off. A clinic kill switch does not block operator alerts.
4. `SMS_PROVIDER=console` logs the text and spends nothing. Switch to
   `mobile_message` only when you are ready to send for real.

## The notification mentioned a customer's name or number

That is a bug. Stop sending (kill switch), and do not approve further drafts
until it is fixed. Notifications are only allowed to carry the clinic name
and a dashboard link.

## A fact I just added is not being used in replies

New and edited knowledge base entries wait for review. Open the clinic,
Knowledge base, and use Review and make active. Until then the model cannot
see the entry, on purpose: a mistake must not poison the knowledge base.

A clinic voice change waits the same way. Open the clinic settings page.
Until you review it, drafts still use the previous voice, or the default
Australian SMS tone if none was set. Voice cannot make a draft auto-send
a claim the knowledge base does not support.

## A clinic has no do-not-answer coverage

The knowledge page warns when there are no blocked or missing entries.
Nine of the eleven clinics start that way. Write those entries yourself;
they are not generated. Beauty Soiree is the one that already has them.

## The widget on the landing page does nothing

1. The clinic must not be archived.
2. The landing page origin must be listed under widget origins (scheme and
   host only, e.g. `https://offers.thebeautysoiree.com.au`).
3. A failed submit must show an error on the form. If it says thanks, the
   POST reached us. Look in the queue.
4. The snippet is `/widget.js` with `data-clinic="the-slug"`.

## A CSV import wrote the wrong booking link

Nothing is written until Confirm import. If the preview looked wrong, do not
confirm. Imported rows wait for review before the model can cite them. The
audit log has one `kb.csv_imported` row with created / updated / skipped
counts.

## A queued draft still shows an old failure code

Validator rules change during a build. Open the draft and use Re-validate
(keyboard `v`). That runs today's checks and replaces the chips. It does not
send. If every check passes, Approve to send.

## Someone opted out and I cannot see who

Open the clinic, Opt-outs. Each row is the number, the date, and how: they
texted STOP, or the SMS provider refused the send.

## I cannot SSH to the server

The droplet is `168.144.174.105`. Ping can succeed while port 22 times out.
That is fail2ban, not a dead box. Ubuntu 24.04 bans the client IP after a
handful of rejected public keys. Wait ten minutes and try **one** user with
**one** key:

```bash
ssh -i ~/.ssh/reflex_sms -o IdentitiesOnly=yes USER@168.144.174.105
```

Do not probe root, ubuntu, reflex, and so on in a row. Each miss counts.
There is no `Host reflex` entry in `~/.ssh/config` on the laptop this was
first deployed from, so `ssh reflex` in the README does not actually hit
the droplet until someone adds one.

The key file `~/.ssh/reflex_sms` is encrypted (aes256-ctr). Load it into
the agent (`ssh-add ~/.ssh/reflex_sms`) so a passphrase prompt is not
required on every command. If the server answers `Permission denied
(publickey)` after the key is offered, that username does not have this
public key in `authorized_keys`. Install the `reflex-sms` public key for
the real login user via the DigitalOcean console, then retry.

## First production bring-up (what actually broke)

Recorded 28 Aug 2026, first attempt to clone into `/opt/clinicboost`.

1. **SSH username was not on the laptop.** README said `ssh reflex`. There
   was no SSH config host by that name. Trying likely users (root, ubuntu,
   reflex, and others) against `reflex_sms` all returned `Permission denied
   (publickey)`. After five or six misses, port 22 started timing out while
   ping still worked. fail2ban. The health panel and Caddy never started
   because we never got a shell.
2. **The deploy key may not be on the droplet.** Verbose SSH offered
   `reflex_sms` and the server never accepted it for `root`. Until that
   public key is in `authorized_keys` for a known user, clone, compose and
   seed cannot run.
3. **A git clone is not enough to seed.** `knowledge-source/converted/` is
   gitignored (client content) and dockerignored. `npm run db:seed` refuses
   to run without `knowledge-source/converted/beauty-soiree.md`. Copy that
   file onto the server after clone, or the seed exits before writing
   Beauty Soiree.
4. **Disk.** 5.2GB free on an 8.7GB disk. `docker compose build` will pull
   `node:22-alpine`, `postgres:16-alpine` and `caddy:2-alpine` and keep
   Next.js build layers. Run `docker image prune -af` and `df -h /` before
   and after the build. Do not `npm ci` on the host as well as in the
   image.
5. **`.env` must stay out of the image.** `.dockerignore` already lists
   `.env` and `.env.local`. Compose mounts it with `env_file: .env`. After
   the first successful build, confirm with
   `docker compose run --rm --entrypoint sh app -c "test ! -f /app/.env && echo no-.env"`
   and that `SMS_PROVIDER` inside the container is `console`.
6. **Operator password.** Do not copy `OPERATOR_PASSWORD_HASH` from the
   laptop. Hash a new password on the laptop (`npm run hash-password`),
   put only the hash on the server, and keep `SMS_PROVIDER=console` until
   someone explicitly switches it. Fifty SMS credits.

Until SSH works, https://reply.clinicboost.com.au/ will not load. That is
expected: Caddy is not running yet, and ufw dropping closed ports looks
like a hang rather than a connection refused.
