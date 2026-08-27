# Runbook

Written for the operator. Symptom, cause, what to do. Expand this as the
product grows; the most likely real-world failure is a credential or account
issue, not code.

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
