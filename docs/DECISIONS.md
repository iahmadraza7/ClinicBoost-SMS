# Decision log

Every line here was agreed with the client. If a decision changes, edit it here
and note the date. Do not let a decision live only in the chat thread.

## Commercial

| | |
|---|---|
| Price | $819 fixed, Fiverr |
| Timeline | 20 days from 26 Aug 2026 |
| Post-handover rate | $35/hr, 1hr minimum, via Fiverr |
| Retainer offered | $300/mo for 10hrs plus priority (not taken up) |
| Warranty | Bugs in delivered scope fixed free for 30 days |
| IP | Full source code and commercial rights including resale, transferred on delivery |

## Architecture

- **Confidence score is not the send gate.** Every factual sentence must resolve
  to a KB entry. Client agreed: "I like the idea of it being more than
  confidence score since AI hallucinates a lot."
- **Non-inventable fields**, client's own words: prices, time between
  treatments, contraindications.
- **Durable queue** so nothing is lost during a Mobile Message or Claude outage.
  Persist first, then enqueue, then call.
- **Web search** may assist a queued draft as an unverified suggestion. It never
  feeds an auto-send. Client originally wanted search-then-flag; this was the
  agreed refinement.
- **Conversation retained indefinitely** per `(clinic, mobile)`. Recent messages
  verbatim, older ones as a rolling summary. Client: "Retain the conversation or
  if its easier to keep a summary."
- **KB edits require review** before becoming permanent. Client: "in case we put
  something wrong and poison the knowledge base."
- **Per-treatment booking URLs**, uploaded by CSV.
- **Missed-call text-back** is Phase 2, but the conversation model carries a
  `source_type` on inbound events now so it slots in without a rewrite. No
  charge for that hook.

## Compliance

- **TGA / AHPRA** raised by us, not in the brief. S4 prescription medicines
  cannot be named in public advertising; the practitioner exemption does not
  cover an agency's automated SMS. Enforced by a per-clinic blocked terms list
  checked against model output and KB content. Client to confirm with whoever
  handles clinic ad compliance before auto-send rules are finalised.
- **Privacy Act APP 8** raised by us. Server is Sydney for this reason.
- **Resend has no Australian region.** Region only controls dispatch; all Resend
  account data sits in the US regardless. Resolved by removing PII from
  notifications entirely rather than writing a privacy policy disclosure.
  Client agreed 26 Aug: "no actual info other than clinic name."
- **Spam Act**: inbound enquiry implies consent. No marketing sends. Opt-out
  tracked per contact per clinic.

## Infrastructure

- DigitalOcean Sydney, resized from 512MB to 4GB on our flag
- `168.144.174.105`, app at `reply.clinicboost.com.au`
- Resend Tokyo send region, `notify.clinicboost.com.au`, verified, receiving off
- Client owns every account. Access is by SSH key and API keys, no user seats.

## Testing

- Shared Mobile Message number `+61 485 900 170`, 50 credits
- Client buys a dedicated number and bulk credits only after seeing it work
  (one-time discount, only available at point of number purchase)
- **Beauty Soiree is the single end-to-end test clinic.** Chosen because its
  skill file already contains the "Unconfirmed — do not answer" list and
  compliance rules, so validation gets exercised rather than just the happy path
- Client's own mobile as the test contact
- Shared number cannot prove multi-clinic inbound routing. Deferred, and must be
  config not rebuild.

## Open / watch list

- **11 clinics, not the 10 in the brief.** Flagged, absorbed, not charged. Do not
  hardcode 10.
- **10 of 11 clinic files have no "do not answer" section.** We import what
  exists and surface gaps in the dashboard. Writing that content is the client's
  job, not ours. Hold this line if it drifts.
- Client to send Resend and Mobile Message credentials via a secrets manager,
  not chat. Two keys were already posted in the Fiverr thread and flagged.
- Disk is 8.7GB. Monitor.
