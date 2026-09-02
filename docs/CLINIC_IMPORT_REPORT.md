# Clinic import report

Generated when `npm run db:seed` or `docker compose exec app node dist/seed.cjs` runs.
Lists what was imported from each converted skill file and what is still missing.

Voice is empty for every clinic until the client writes it.

## beauty-soiree

Imported: 2 offers, 35 knowledge base entries (6 blocked, 7 instructions).

**Missing from skill file:** none flagged.

**Notes:**
- Only clinic with an explicit do-not-answer list and compliance block in the skill file.

## contour-haus

Imported: 2 offers, 27 knowledge base entries (0 blocked, 7 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block

## defined-cosmetics

Imported: 1 offers, 20 knowledge base entries (0 blocked, 5 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block

## gem-esthetics

Imported: 1 offers, 18 knowledge base entries (0 blocked, 7 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block
- Opening hours not in skill file
- Phone number not in skill file
- No widget origins configured

**Notes:**
- Specific street address not stated on the landing page.
- Phone number and opening hours not in the skill file.
- Widget origins not configured; booking is on Timely.

## glam-and-glow

Imported: 4 offers, 35 knowledge base entries (0 blocked, 7 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block

## love-your-skin

Imported: 4 offers, 44 knowledge base entries (0 blocked, 8 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block

**Notes:**
- Two locations with different hours; Fat-Freeze and Lymphatic Drainage are Caroline Springs-based per the page.

## luxury-brows-perth

Imported: 1 offers, 21 knowledge base entries (2 blocked, 4 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block
- No widget origins configured
- Opening hours not in skill file

**Notes:**
- Landing page contains an unconfirmed HIFU/$289 CTA fragment; seeded as a blocked policy entry until Theo confirms.
- Opening hours not in the skill file.

## nhb-endermologie

Imported: 2 offers, 26 knowledge base entries (2 blocked, 5 instructions).

**Missing from skill file (gaps):**
- Booking platform not set (operator must choose)
- Close type not set (operator must choose)
- No explicit do-not-answer / unconfirmed list
- No compliance rules block
- No widget origins configured

**Notes:**
- Skill file uses a different structure; normalised by hand.
- Fresha mentioned in Booking Process but booking platform and close type not set in Clinic Config - operator must choose.
- No phone number in skill file.

## rickys-aesthetics

Imported: 1 offers, 19 knowledge base entries (1 blocked, 3 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block
- No widget origins configured

**Notes:**
- Landing page has internal inconsistency on neck inclusion; seeded as blocked FAQ until Ricky confirms.

## skin-sculpt-studio

Imported: 2 offers, 28 knowledge base entries (0 blocked, 6 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block
- No widget origins configured

**Notes:**
- Two Timely offers; link-only close with no manual booking step.

## three-sisters-beauty

Imported: 2 offers, 28 knowledge base entries (0 blocked, 6 instructions).

**Missing from skill file (gaps):**
- No explicit do-not-answer / unconfirmed list
- No compliance rules block
- No widget origins configured

**Notes:**
- Fresha self-serve instant confirm; link-only close.
- Multi-depth upgrade is a second offer, not proactively pushed on first contact.

