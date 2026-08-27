# Data model

Postgres 16 + Drizzle. Every domain table has a non-null `clinic_id`.
Timestamps are `timestamptz`. Ids are uuid v7 unless noted.

## clinics

```
id                  uuid pk
slug                text unique          -- beauty-soiree
name                text                 -- Beauty Soiree Medispa, Brisbane
location            text
hours               text nullable        -- some clinics have NOT CONFIRMED
phone               text nullable
payment_notes       text nullable        -- e.g. Afterpay available
booking_platform    text                 -- fresha | timely | wix | other
close_type          text                 -- link_only | manual
sms_number          text nullable        -- dedicated AU number, null while testing
confidence_threshold int default 90
kill_switch         boolean default false
notify_email        boolean default true
notify_sms          boolean default false
unattended_minutes  int default 15
widget_theme        jsonb
widget_origins      text[] not null default '{}'
archived_at         timestamptz nullable
created_at, updated_at
```

`widget_origins` was added during slice one (migration `0001`). The widget
endpoint is public and CORS has to be restricted to the clinic's own landing
pages, so the allowed origins have to live somewhere. Empty means the endpoint
accepts no cross-origin browser submissions for that clinic.

`close_type` matters. A `manual` clinic must never be told the booking is
confirmed. A `link_only` clinic must never be told someone will get back to
them. The clinic form makes the operator pick that behaviour, not a label.

`archived_at` is set when the operator archives a clinic. Archived clinics
stay in the table (contacts, drafts and the audit log are kept) but the
widget, the approval queue and inbound SMS routing skip them. Restore
clears the timestamp.

## kb_entries

The knowledge base. One row per addressable fact. `entry_key` is what the model
cites in `claims[].source_id`.

```
id                  uuid pk
clinic_id           uuid fk not null
entry_key           text        -- beauty-soiree.hifu-499.duration
category            text        -- config | offer | policy | faq | booking
offer_id            uuid nullable fk -> offers
title               text
body                text
status              text        -- active | pending_review | archived
answer_mode         text        -- answerable | blocked | missing
block_deflect       text nullable  -- what to say instead when blocked
trigger_terms       text[] not null default '{}'
source              text        -- imported | operator_edit | operator_answer
created_by          text
reviewed_by         text nullable
reviewed_at         timestamptz nullable
created_at, updated_at

unique (clinic_id, entry_key)
```

`answer_mode` is the important column. The editor makes the operator pick the
behaviour, not a label:

- `answerable` — can be cited and sent
- `blocked` — never attempt, always queue, deflect with `block_deflect`
- `missing` — known gap. Flag as unanswerable, store the operator's later
  answer.

Operator create and edit always land as `pending_review`. The model only
reads `active` entries (`listKbEntries(..., { activeOnly: true })`). Review
is a separate action that sets `status = active` and records `reviewed_by`
and `reviewed_at` on its own audit row. A clinic with zero live `blocked` or
`missing` entries is warned in the editor; that content is not generated.

Blocked terms are checked against the entry body (and title / deflect) on
save, so Schedule 4 names in the client's own offer copy cannot be cited as
a source.

`trigger_terms` was added during the validator slice (migration `0002`). A
`blocked` entry is only enforceable if the validator can tell that the topic has
come up. "Do not answer whether HIFU hurts" needs the words "hurt", "painful"
and so on written down somewhere it can read. Citing a blocked entry trips
`ANSWER_MODE_BLOCKED` on its own; trigger terms catch the case where the model
answers the topic without citing anything, and they also match against the
customer's inbound question. Only `blocked` entries need them.

## offers

```
id                  uuid pk
clinic_id           uuid fk not null
name                text        -- HIFU Lower Face, Jaw & Neck Lift
price_cents         int nullable
price_display       text        -- "$499" exactly as it may appear in a draft
rrp_display         text nullable
booking_url         text
active              boolean
notes               text
created_at, updated_at
```

`price_display` exists so the validator can string-match. Never format a price
from `price_cents` into a draft.

## blocked_terms

```
id, clinic_id, term, reason, created_at
```

Checked against draft output AND kb_entry body on save.

There is no global row: `clinic_id` is non-null and nothing reads across
clinics. The shared S4 baseline lives in code, at
`src/server/compliance/s4-baseline.ts`, and is copied into each clinic when the
clinic is created. Per-clinic additions go straight into this table.

## contacts

```
id                  uuid pk
clinic_id           uuid fk not null
mobile              text not null
name                text nullable
opted_out           boolean default false
opted_out_at        timestamptz nullable
consent_source      text        -- widget | sms_inbound | operator
consent_at          timestamptz
created_at, updated_at

unique (clinic_id, mobile)
```

Opt-out is per contact per clinic, never global.

## conversations

```
id                  uuid pk
clinic_id           uuid fk not null
contact_id          uuid fk not null
source_type         text        -- widget | sms_inbound | missed_call (phase 2) | operator
summary             text nullable   -- rolling summary of older messages
last_message_at     timestamptz
created_at
```

One conversation per contact per clinic, never restarted.

## messages

```
id                  uuid pk
clinic_id           uuid fk not null
conversation_id     uuid fk not null
direction           text        -- inbound | outbound
body                text
segments            int
status              text        -- queued | sent | delivered | failed | rejected
provider_message_id text nullable
created_at
```

## drafts

```
id                  uuid pk
clinic_id           uuid fk not null
conversation_id     uuid fk not null
inbound_message_id  uuid fk not null
draft_body          text
claims              jsonb       -- [{text, source_id}]
matched_offer_id    uuid nullable
self_confidence     int
validation_result   jsonb       -- {passed: bool, failures: [{code, detail}]}
state               text        -- auto_sent | pending | approved | edited | rejected
edited_body         text nullable
decided_by          text nullable
decided_at          timestamptz nullable
notified_at         timestamptz nullable
escalated_at        timestamptz nullable   -- when SMS alert fired
created_at
```

`validation_result.failures[].code` is machine-readable so the queue can group
and the runbook can reference it.

`notified_at` is when the queue-landing email went (or was skipped because
email is off for that clinic). `escalated_at` is when the unattended SMS went
(or was skipped). Auto-sent drafts are never notified. Operator SMS alerts
are stored on a sentinel contact (`mobile = "operator"`) so they never land
on a customer thread.

## usage_counters

```
id, clinic_id, period_month, segments_out, segments_in, ai_calls, updated_at
unique (clinic_id, period_month)
```

## audit_log

```
id, clinic_id, actor, action, entity_type, entity_id, before jsonb, after jsonb, created_at
```

Every approve, edit, reject, send, KB change (including create, update,
review, archive and restore), threshold change, kill switch toggle, clinic
create, clinic update, archive and restore.

## Validation failure codes

Use these strings. The runbook and dashboard both reference them.

```
SCHEMA_INVALID          model output did not parse
SOURCE_UNKNOWN          cited a source_id that does not exist for this clinic
SENTENCE_UNCOVERED      a draft sentence had no claim
PRICE_UNVERIFIED        price not string-matched in KB
INTERVAL_UNVERIFIED     treatment interval not in KB
CONTRA_UNVERIFIED       contraindication or suitability not in KB
URL_UNVERIFIED          link not present verbatim in KB
BLOCKED_TERM            hit the clinic blocked terms list
ANSWER_MODE_BLOCKED     touched a do-not-answer entry
UNANSWERABLE            no KB coverage at all
AI_UNAVAILABLE          drafting failed after retries, reply by hand
CONTACT_OPTED_OUT       contact has opted out
BELOW_THRESHOLD         self_confidence under clinic threshold
KILL_SWITCH             clinic kill switch on
SEGMENTS_EXCEEDED       draft too long
```

`SCHEMA_INVALID` stops the checks that read the draft, because there is no
draft to read. `CONTACT_OPTED_OUT` and `KILL_SWITCH` are still reported: they
describe the contact and the clinic rather than the model's output, so they hold
whatever the model returned.

The same codes are reused by the send guard, which re-runs `BLOCKED_TERM`,
`CONTACT_OPTED_OUT`, `KILL_SWITCH` and `SEGMENTS_EXCEEDED` at the moment of
sending. Approval and delivery can be hours apart, and an operator's edited text
has never been past the validator at all.

## Message status

`messages.status` is `queued` on creation, before anything is sent.

| Ours | Set by | Mobile Message |
|---|---|---|
| `queued` | us, when the reply is authorised | `pending`, `scheduled` |
| `sent` | the send worker, on a successful call | `sent` |
| `delivered` | the status webhook | `delivered` |
| `failed` | the send worker or the status webhook | `failed` |
| `rejected` | the send guard, when it refuses to send | `cancelled` |

`rejected` means we declined to send. `failed` means we tried and it did not
arrive.
