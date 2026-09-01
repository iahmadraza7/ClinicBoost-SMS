# Operator guide

Written for the person running ClinicBoost SMS day to day. When something
breaks, start with the health panel and `docs/RUNBOOK.md`. This guide covers
the normal work: clinics, knowledge base, thresholds, kill switch and audit.

Sign in at https://reply.clinicboost.com.au/login. There is one account. After
a deploy you will need to sign in again.

## The dashboard

The home page is a health check, not a report. Eight rows tell you whether the
server, database, backup age, Claude key, SMS credits, email sending,
background worker and last outbound SMS are OK. Fix anything red or amber
before digging into the queue.

Below that is this month's usage per clinic: SMS segments in and out, and how
many AI drafts were generated.

Navigation:

| Page | What it is for |
|---|---|
| Home | Health and usage |
| Queue | Drafts waiting for you |
| Clinics | Settings and knowledge base per clinic |
| Audit | Record of every action, with revert on dismiss and redraft |

## Adding a clinic

1. Open **Clinics** → **Add clinic**.
2. **Slug** is permanent. It appears in the widget URL and in paths like
   `/clinics/beauty-soiree`. Lowercase and hyphens only, e.g. `beauty-soiree`.
3. Fill in **name**, **location**, **phone** and **hours**. If hours are not
   confirmed, leave them blank. The system will refuse to invent them.
4. Pick the **booking platform** (Fresha, Timely, etc.).
5. Pick **how a booking gets confirmed**:
   - **Link only** — the customer books via a link and the platform confirms
     instantly. Drafts may say the link is the booking step.
   - **Manual** — a human confirms. Drafts must never tell the customer the
     booking is already confirmed.
6. **SMS number** — leave blank while every clinic shares the Mobile Message
   test number. Set a dedicated number here once one is bought for this clinic.
7. **Widget origins** — list every landing page that may embed the widget,
   scheme and host only, e.g. `https://offers.thebeautysoiree.com.au`. Without
   this, the browser blocks the form.
8. **Voice** — optional tone notes for SMS. A change waits for review like a
   knowledge base edit. Voice cannot make a draft auto-send a fact that is not
   in the knowledge base.
9. **Confidence threshold** — default 90. See below.
10. **Kill switch**, **notify email**, **notify SMS** and **unattended
    minutes** — see below.

On create, the Schedule 4 blocked-terms baseline is copied in automatically.
The knowledge base itself is empty until you import or write entries.

Next steps for a new clinic:

1. Open the clinic → **Knowledge base**. Import from CSV/JSON or add entries
   by hand.
2. Upload **booking URLs** as a CSV (one row per treatment).
3. Add **blocked** and **missing** entries for topics the clinic must not
   answer or has not documented yet. Nine of the eleven clinics start with
   none; Beauty Soiree is the template.
4. Put the widget snippet on the landing page:
   ```html
   <script src="https://reply.clinicboost.com.au/widget.js" data-clinic="the-slug"></script>
   ```
5. When ready to send real SMS, set `SMS_PROVIDER=mobile_message` on the
   server (see `docs/TECHNICAL_README.md`).

## Editing the knowledge base

Open **Clinics** → pick a clinic → **Knowledge base**.

Every entry has two independent choices. The form explains the consequence of
each; you are not picking a label.

### What the entry is (`entry_kind`)

| Choice | Meaning |
|---|---|
| **Fact** | Something the model may state to a customer: price, duration, location, booking URL. May be cited as a source. A fully grounded draft that cites it may auto-send. |
| **Instruction** | How the model should behave: SMS format, compliance rules, close mechanics, price-contrast notes. Never a valid citation. If the model cites one, the draft is queued. |

Policy entries, close-mechanics and price-contrast are instructions. Config
and offer prices are facts.

The model reads instruction text in the prompt even though it cannot cite it.
It may still paraphrase what an instruction says. Numbers lifted from an
instruction (e.g. competitor prices in a price-contrast note) are caught today
because instructions are not in the price corpus. A claim with no numbers,
written only in an instruction, may not be caught. Do not put customer-facing
facts in instructions; put them in facts, or accept that the draft may queue.

### How the entry is used (`answer_mode`)

| Choice | Meaning |
|---|---|
| **Can be cited and sent** | Live once reviewed. The model may use it and auto-send if everything else passes. |
| **Never attempt, always queue** | A do-not-answer topic. Write what to say instead (`block_deflect`) and **trigger terms** (words that tell the system the topic came up, e.g. "hurt", "painful"). |
| **Known gap** | Deliberately absent. The enquiry is flagged unanswerable; your later answer is stored permanently. |

### Review before go-live

New entries, edits, CSV imports and voice changes land as **pending review**.
The model cannot see them until you **Review and make active**. That is
deliberate: a mistake must not poison live replies.

**Pending edits** on the knowledge page are suggestions from queue edits you
saved. Review them the same way.

### Search, inline edit, export

The list supports search on title and body. You can edit the body inline for
small fixes; open the full entry for mode, kind and trigger terms.

**Export / import** at the top of the knowledge page is lossless CSV or JSON.
Import shows a preview (created / updated / skipped) before anything is
written. Imported rows still wait for review.

### Booking URLs

Use the CSV upload on the knowledge page: treatment name and booking URL per
row. Preview first; confirm only when it looks right.

## Confidence threshold

Each clinic has a threshold from 1 to 100, default **90**.

A draft only auto-sends when **every** check passes, including:

- Every sentence is backed by a **fact** in the knowledge base
- No invented prices, intervals or URLs
- No blocked Schedule 4 terms
- The model's self-reported confidence is **at least** the threshold

Lowering the threshold does not bypass grounding. A draft with an unverified
price still queues even at threshold 1. Raising the threshold queues more
drafts that would otherwise have auto-sent on confidence alone.

Change it on the clinic settings page. It is audited.

## Kill switch

Two levels:

| Switch | Where | Effect |
|---|---|---|
| **Clinic kill switch** | Clinic settings → "Kill switch" | No SMS goes out **for that clinic**. Drafts still generate and queue. Operator alert SMS still works. |
| **Global kill switch** | Server `.env` → `GLOBAL_KILL_SWITCH=true` | Nothing sends, including operator alerts. Unattended SMS alerts retry when it is turned off. |

Use the clinic switch when one clinic needs to pause. Use the global switch for
an emergency (bad draft getting through, credential leak, investigation).

Queued drafts show a red **kill switch on** chip when the clinic switch is
active.

## The queue (day to day)

When a draft does not auto-send, it appears at **Queue**. You see the
customer's question, the proposed SMS, failure chips (why it queued) and
segment count.

| Action | Key | What it does |
|---|---|---|
| Approve | `a` | Send as shown (must pass validation at send time) |
| Edit | `e` then Ctrl+Enter | Save your wording without sending. Can create a pending KB entry. |
| Redraft | `r` | Send back to the model with a note |
| Dismiss | `d` | Remove from queue without sending |
| Re-validate | `v` | Re-run today's rules on an old draft |

Auto-sent drafts do not email you. Only queued drafts trigger notifications.

Notification emails and SMS contain **only** the clinic name and a link to the
queue. No customer name, number or question text.

## Audit log

Open **Audit**. Every approve, edit, dismiss, redraft, send, knowledge base
change, threshold change and kill switch toggle is recorded with who did it
and when.

Filter by clinic or action type.

**Dismiss** and **redraft** can be **reverted** from the audit row. That puts
the draft back in the queue as it was.

## Archiving a clinic

Archived clinics do not accept widget submissions and cannot have knowledge
base changes until restored. The audit log and history remain.

## Where to go next

| Situation | Document |
|---|---|
| Something broke | `docs/RUNBOOK.md` |
| Database backup or disaster recovery | `docs/BACKUP_AND_RESTORE.md` |
| Deploying an update or finding secrets | `docs/TECHNICAL_README.md` |
| Data model and failure codes | `docs/SCHEMA.md` |
