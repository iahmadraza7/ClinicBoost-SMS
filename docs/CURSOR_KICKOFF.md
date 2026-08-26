# Cursor kickoff

Model: Claude Opus 5 (high). Agent mode. Open the folder `D:\fiverr\ted`.

Cursor picks up `.cursor/rules/*.mdc` automatically. `CLAUDE.md` and the docs
are not auto-loaded, so reference them explicitly in the first prompt of each
new session.

---

## Prompt 1 — orientation and slice one

```
Read CLAUDE.md, docs/DECISIONS.md and docs/SCHEMA.md fully before doing anything.

Do not write code yet. First tell me, in under 200 words:
1. Anything in those docs that contradicts itself
2. Anything the schema cannot express that the requirements need
3. The three decisions you think are most likely to cause rework later

Then wait for me.
```

Answer its questions before letting it build. This one exchange is worth more
than an hour of correcting generated code.

---

## Prompt 2 — scaffold

```
Scaffold the Next.js App Router + TypeScript project in place, at the repo root.
Drizzle for Postgres, pg-boss for the queue, Zod for validation, Tailwind.

Include a multi-stage Dockerfile with `runner` and `worker` targets matching the
existing docker-compose.yml.

Implement docs/SCHEMA.md as Drizzle schema plus the first migration. Every
domain table gets a non-null clinic_id.

Create src/server/repo/ with the repository layer. Every function takes clinicId
as its explicit first argument. Nothing outside this directory may import the
Drizzle client.

Do not build any UI yet. Stop when `docker compose up` starts cleanly and the
migration applies.
```

---

## Prompt 3 — slice one, end to end

```
Vertical slice, end to end, no layering ahead:

1. Public widget endpoint POST /api/widget/:clinicSlug accepting name, mobile,
   question. Rate limited, CORS restricted to that clinic's domain.
2. Persist contact, conversation, inbound message. Consent record with
   source=widget.
3. Enqueue a pg-boss job. Do NOT call Claude yet, stub the draft.
4. Operator dashboard at /queue listing pending items for all clinics, newest
   first, with a keyboard-driven approve / edit / reject. The client works by
   cycling fast, so this must be usable from the keyboard alone.
5. Audit log every decision.

Seed one clinic, beauty-soiree, from knowledge-source/converted/beauty-soiree.md.
Run scripts/convert-skills.py first if that file does not exist.

Stop when I can submit a fake enquiry and see it in the queue.
```

---

## Prompt 4 — the validator

This is the module the client actually bought. Slow down here.

```
Implement src/server/validation/ per the "Validator" section of CLAUDE.md and
the failure codes in docs/SCHEMA.md.

Write the tests FIRST, using real content from
knowledge-source/converted/beauty-soiree.md as fixtures. Cover at minimum:

- a clean grounded draft passes
- a draft quoting $450 when the KB says $499 fails PRICE_UNVERIFIED
- a draft answering "does HIFU hurt" fails ANSWER_MODE_BLOCKED, because that
  clinic's file explicitly lists it as unconfirmed
- a draft naming a Schedule 4 product fails BLOCKED_TERM
- a draft inventing a booking URL fails URL_UNVERIFIED
- a draft stating a treatment interval not in the KB fails INTERVAL_UNVERIFIED
- a citation to another clinic's entry_key fails SOURCE_UNKNOWN
- self_confidence 99 with any failure above still queues

The validator trusts nothing the model says. Confidence is the last check, not
the first.
```

---

## Prompt 5 — drafting

```
Implement src/server/ai/ .

Send the clinic's ENTIRE knowledge base in the system prompt with Anthropic
prompt caching enabled. No chunking, no embeddings, no retrieval.

The model returns the JSON contract in CLAUDE.md and nothing else. Parse
defensively with Zod.

The system prompt must carry, from the clinic record: close_type behaviour,
blocked terms, do-not-answer entries with their deflect text, and the SMS
formatting rules in .cursor/rules/030-compliance.mdc.

Wire it into the worker job in place of the stub. Validator runs after. Draft
auto-sends only if validation passes fully.
```

---

## Then, in order

6. Mobile Message adapter behind an interface. Inbound webhook with signature
   verification. Delivery status. Segment counting.
7. Notifications. Email instant, SMS after the unattended window. Clinic name
   and dashboard link only, never PII.
8. KB editor with the review step. CSV upload for per-treatment booking URLs.
9. Widget JS snippet, themeable, for WordPress and Elementor.
10. Usage counters, opt-out, health panel for Claude key, Mobile Message credits
    and Resend domain.
11. Deploy to the server. Then the four handover documents.

## Session hygiene

- One task per session. Long sessions drift and start re-deciding settled things.
- Start each new session with: `Read CLAUDE.md and docs/DECISIONS.md first.`
- When Cursor proposes something that contradicts a decision, do not argue in
  chat. Point it at the file.
- Commit at the end of every slice. Small commits make bad generations cheap to
  throw away.
