# Agent instructions

All project context, decisions and constraints live in `CLAUDE.md` at the repo
root. Read it before writing code.

Additional always-on rules are in `.cursor/rules/`.

Quick reminders:

- Never auto-send a draft that is not fully grounded in the knowledge base
- Never invent a price, treatment interval or contraindication
- Never name a Schedule 4 prescription medicine
- Notification emails and SMS carry no personal data
- Every query is scoped by `clinic_id`
- No vector DB, no Redis, no microservices
