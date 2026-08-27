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
