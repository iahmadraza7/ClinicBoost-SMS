# ClinicBoost SMS — Project Context

Read this before writing any code. It is the single source of truth for decisions
already agreed with the client. Do not re-decide anything in here without asking.

## What this is

A custom AI-assisted SMS enquiry and approval system for a Meta ads agency
(Reflex / ClinicBoost) serving aesthetic clinics in Australia. It replaces
GoHighLevel.

Flow: a lead submits name, mobile and a question on a clinic landing page.
The system drafts an SMS reply grounded in that clinic's knowledge base.
High-confidence, fully-grounded drafts auto-send. Everything else waits in an
approval queue for the operator (Ted) to approve, edit or reject.

Single operator. 11 clinics. Not a multi-user product yet.

## Non-negotiable rules

1. **A draft never auto-sends unless every factual sentence maps to a knowledge
   base entry.** The model's self-reported confidence is not the gate. It is one
   signal on top of deterministic validation.
2. **Never invent a price, a treatment interval, or a contraindication.** These
   are hard-blocked. If the exact value is not in the KB, the draft is queued.
3. **Never name a Schedule 4 prescription medicine** (botulinum toxin brands,
   dermal filler brands, "anti wrinkle injections" and similar category terms).
   Australian TGA law prohibits referring to these in advertising to the public.
   Per-clinic blocked terms list enforces this.
4. **Notification emails and SMS carry no personal data.** Clinic name plus a
   dashboard link only. No question text, no mobile number, no name.
   Reason: Resend stores all account data in the US regardless of send region.
5. **Every query is scoped by `clinic_id`.** The repository layer must make it
   impossible to query without one.
6. **Nothing is lost on API failure.** Persist first, then enqueue, then call
   external APIs. Retry with backoff.
7. **Web search output never feeds an auto-send.** It may populate a suggested
   answer in the queue, marked as unverified, for the operator to accept.

## Stack (decided, do not substitute)

| Concern | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript | Brief specifies JavaScript. One app for dashboard, widget API and webhooks. |
| DB | Postgres 16 | Single DB, single backup. |
| Queue | pg-boss | Runs on the same Postgres. No Redis — the server is 4GB / 8.7GB disk. |
| Worker | Separate Node process | Same repo, own container. |
| ORM | Drizzle | Typed, thin, easy to audit for `clinic_id` scoping. |
| Auth | Lucia or Auth.js, credentials only | Single operator. No social login. |
| Deploy | Docker Compose on DigitalOcean | Caddy in front for automatic TLS. |
| LLM | Claude Sonnet via Anthropic API | Client's key. Prompt caching on the clinic KB. |
| SMS | Mobile Message | Behind an adapter interface. Twilio must be droppable in. |
| Email | Resend | Sending only. Receiving disabled. |

### Explicitly rejected

- **No vector database, no embeddings, no chunking.** A full clinic knowledge
  base is roughly 2,000 tokens. Send the whole thing with prompt caching. Cache
  reads cost 10% of normal input. Retrieval would only add a way to silently
  miss the one chunk that mattered. Revisit only if a clinic's KB exceeds
  ~30,000 tokens.
- **No Redis.** pg-boss covers the queue.
- **No microservices.** One Next.js app plus one worker.

## Infrastructure (live)

- Server: DigitalOcean Sydney, 4GB / 2 vCPU / 8.7GB disk, Ubuntu 24.04
- IP: `168.144.174.105`
- App domain: `reply.clinicboost.com.au` (A record already pointing at the IP)
- Email domain: `notify.clinicboost.com.au` (Resend, Tokyo send region, verified)
- Docker 29.7.2, Compose v5.5.0, ufw + fail2ban active, key-only SSH, 1GB swap
- Disk is tight. Prune Docker images. Watch `df -h /`.

## Testing constraints

- Mobile Message test number is **shared**: `+61 485 900 170`
- Only **50 SMS credits** until the client buys a dedicated number
- Therefore: **Beauty Soiree is the single test clinic**, end to end
- A shared number cannot prove per-clinic inbound routing. That is validated
  later when the first dedicated number is purchased. Routing must be a config
  change, not a rebuild.
- Use fake/failing cases first so the queue and the blocking layer are exercised
  before spending credits on happy paths.

## Knowledge base source

11 clinic skill files live in `knowledge-source/raw/` as .docx. They were written
by the client for a manual Claude workflow and are a very good schema fit.

Common structure:
`Clinic Config` → `Active Offers` → `Step 1..5` → `What this skill does not do`
→ `Maintenance note`

Two things to know:

- **Only `beauty-soiree` has an "Unconfirmed — do not answer" section and a
  "Compliance rules" block.** That section is precisely the deterministic block
  list. The other ten have no equivalent, so they have nothing to block on yet.
  Import what exists, then surface the gap per clinic in the dashboard so the
  client fills it in. Do not invent content for the missing ones.
- **`nhb-endermologie` uses a different structure entirely.** Normalise it by
  hand.

### Two distinct kinds of "no answer"

Keep these separate in the schema. They behave differently.

| Kind | Meaning | Behaviour |
|---|---|---|
| `blocked` | Explicitly listed as "do not answer" | Specific deflect, never attempt, always queue |
| `missing` | Simply absent from the KB | Flag as unanswerable, email the operator, store their answer permanently |

## Per-clinic variation that matters

- **`close_type`**: `link_only` (Fresha/Timely instant confirm — the link is the
  whole close) vs `manual` (a human confirms). A `manual` clinic must never be
  told the booking is confirmed.
- **Booking URLs are per treatment**, uploaded by CSV, not one per clinic.
- **Confidence threshold** is per clinic, default 90.
- **Notification settings** are per clinic: email on/off, SMS on/off, unattended
  window (default 15 min).

## Draft generation contract

The model returns JSON only. No prose, no markdown fences.

```json
{
  "draft": "string, the SMS text",
  "claims": [{ "text": "sentence from draft", "source_id": "kb entry id" }],
  "unanswered": false,
  "matched_offer_id": "string or null",
  "self_confidence": 0-100
}
```

Every KB entry has a stable id, e.g. `beauty-soiree.hifu-499.duration`.

### Validator (deterministic, runs after the model, trusts nothing)

Runs in order. Any failure routes to the queue with a reason code.

1. JSON parses and matches the schema
2. Every `source_id` resolves to a real KB **fact** for this clinic.
   Citing an instruction fails `INSTRUCTION_CITED`.
3. Every sentence in `draft` is covered by a claim
4. Currency regex — any price must string-match a price in the KB
5. Interval regex (`\d+\s*(day|week|month|year)s?`) must match the KB
6. Contraindication / suitability language must map to a KB entry, never inferred
7. Any URL must exist verbatim in the KB
8. Blocked terms list for this clinic — zero tolerance
9. Opt-out state for this contact
10. `self_confidence >= clinic.threshold`
11. Kill switch off
12. Segment count within cap

This validator is the core of what was sold. It gets unit tests. Everything else
can be generated; this is written and reviewed carefully.

## Conversation model

- Identity is `(clinic_id, mobile_number)`
- History is retained indefinitely, threads are never restarted
- Recent messages verbatim, older ones collapsed into a rolling summary
- A thread can be opened by any inbound event, with a `source_type` field
  (`widget`, `sms_inbound`, and later `missed_call`). Design for this now so the
  Phase 2 missed-call feature slots in without a rewrite.

## Scope boundary

**In:** widget, two-way SMS, drafting, validation, approval queue, kill switch,
KB editor with review step and CSV upload, unanswerable flagging, notifications,
dashboard, usage counters, opt-out, consent records, audit log, data isolation,
durable queue, deployment, handover docs.

**Out (quoted separately, do not build):** self-serve clinic signup, billing and
subscriptions, reseller portal, missed-call text-back.

If the client asks for an out-of-scope item mid-build, note it and keep going.
Do not silently absorb it.

## Deliverables at handover

1. **Runbook** — symptom, cause, fix. Written for the operator, not a developer.
   Covers: SMS not sending, replies not arriving, drafts stuck, Claude API
   errors, disk filling, credentials expired.
2. **Operator guide** — adding a clinic, editing the KB, thresholds, kill switch,
   audit log.
3. **Technical README** — architecture, the validation layer, deploying an
   update, where secrets live.
4. **Backup and restore** — written and actually tested.

The most likely real-world failure is a credential or account issue, not code.
The dashboard shows the health of the Claude key, Mobile Message credits and the
Resend domain on the front page. The runbook covers those first.

## Working style

- Vertical slices, not layers. First slice: widget submission → persisted →
  visible in the queue. Get it running end to end before adding drafting.
- Write the runbook as you build, not at the end.
- Client is non-technical but sharp. Prefer boring, legible code.
- Source code and full commercial rights transfer to the client on delivery.
