import type { ClinicSeedPack } from "./types";

/**
 * Glam & Glow Aesthetics, transcribed from
 * knowledge-source/converted/glam-and-glow.md. Every body is lifted from that
 * file; nothing invented.
 */
export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/glam-and-glow.md",
  clinic: {
    slug: "glam-and-glow",
    name: "Glam & Glow Aesthetics",
    location: "1209 Hay St, West Perth WA 6005",
    hours: "Mon-Sat 7am-7pm, Sun closed",
    phone: "0439 316 011",
    paymentNotes: null,
    bookingPlatform: "fresha",
    closeType: "manual",
    confidenceThreshold: 90,
    widgetOrigins: ["https://www.fresha.com"],
  },
  offers: [
    {
      key: "hifu-289",
      name: "HIFU Face & Neck Multi-Depth Lift",
      priceCents: 28900,
      priceDisplay: "$289",
      rrpDisplay: null,
      bookingUrl:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A27796213&share=true&pId=2547469",
      notes: null,
    },
    {
      key: "microneedling-tier-1",
      name: "Microneedling Tier 1 - Hydration & Glow",
      priceCents: 12000,
      priceDisplay: "$120",
      rrpDisplay: "$200",
      bookingUrl:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A28309586&share=true&pId=2547469",
      notes: "normally $200",
    },
    {
      key: "microneedling-tier-2",
      name: "Microneedling Tier 2 - Regeneration & Repair",
      priceCents: 19900,
      priceDisplay: "$199",
      rrpDisplay: "$250",
      bookingUrl:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A28309596&share=true&pId=2547469",
      notes: "normally $250, MOST POPULAR",
    },
    {
      key: "microneedling-tier-3",
      name: "Microneedling Tier 3 - Advanced Rejuvenation",
      priceCents: 40000,
      priceDisplay: "$400",
      rrpDisplay: "$650",
      bookingUrl:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A28309599&share=true&pId=2547469",
      notes: "normally $650",
    },
  ],
  entries: [
    {
      entryKey: "glam-and-glow.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Glam & Glow Aesthetics",
    },
    {
      entryKey: "glam-and-glow.config.location",
      category: "config",
      title: "Location",
      body: "1209 Hay St, West Perth WA 6005",
    },
    {
      entryKey: "glam-and-glow.config.hours",
      category: "config",
      title: "Opening hours",
      body: "Mon-Sat 7am-7pm, Sun closed",
    },
    {
      entryKey: "glam-and-glow.config.phone",
      category: "config",
      title: "Phone",
      body: "0439 316 011",
    },
    {
      entryKey: "glam-and-glow.config.therapist",
      category: "config",
      title: "Therapist",
      body:
        "Ola W. - Founder & Lead Skin Therapist, 8 years experience, trained in Italy, Poland & Australia",
    },
    {
      entryKey: "glam-and-glow.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Fresha - Theo books manually once a day/time is confirmed in the thread",
    },
    {
      entryKey: "glam-and-glow.hifu-289.price",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU price",
      body: "HIFU Face & Neck Multi-Depth Lift — $289",
    },
    {
      entryKey: "glam-and-glow.hifu-289.protocol",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU protocol",
      body: "Full multi-depth protocol, 60 min session, one visit",
    },
    {
      entryKey: "glam-and-glow.hifu-289.downtime",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU downtime",
      body:
        "Zero downtime, mild pinkness 1-3 hrs normal, back to normal life same day",
    },
    {
      entryKey: "glam-and-glow.hifu-289.results",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU results",
      body:
        "Results: instant subtle tightness, weeks 2-6 texture/bounce improves, peak 8-12 weeks, lasts 6+ months",
    },
    {
      entryKey: "glam-and-glow.hifu-289.pain",
      category: "faq",
      offerKey: "hifu-289",
      title: "Does HIFU hurt",
      body:
        "Does it hurt: warm tingling, manageable for most, jawline can feel stronger (energy can be reduced)",
    },
    {
      entryKey: "glam-and-glow.hifu-289.contraindications",
      category: "faq",
      offerKey: "hifu-289",
      title: "HIFU contraindications",
      body:
        "Not suitable for: active skin infections/open wounds, severe/cystic acne in area, metal implants/pacemakers near area, pregnant/breastfeeding, very severe laxity (surgery more appropriate)",
    },
    {
      entryKey: "glam-and-glow.hifu-289.combine",
      category: "faq",
      offerKey: "hifu-289",
      title: "Combining HIFU with other treatments",
      body:
        "Can combine with anti-wrinkle/filler but timing matters - clinician plans sequence at consult",
    },
    {
      entryKey: "glam-and-glow.hifu-289.booking-url",
      category: "booking",
      offerKey: "hifu-289",
      title: "HIFU booking link",
      body:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A27796213&share=true&pId=2547469",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-1.price",
      category: "offer",
      offerKey: "microneedling-tier-1",
      title: "Microneedling Tier 1 price",
      body: "Tier 1 - Hydration & Glow — $120 (normally $200)",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-1.description",
      category: "offer",
      offerKey: "microneedling-tier-1",
      title: "Microneedling Tier 1 details",
      body:
        "Microneedling + hyaluronic acid. ~45-60 min, full face. Best for: dullness, dehydration, early fine lines, wanting a fast \"glass skin\" refresh. Entry-level tier.",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-1.booking-url",
      category: "booking",
      offerKey: "microneedling-tier-1",
      title: "Microneedling Tier 1 booking link",
      body:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A28309586&share=true&pId=2547469",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-2.price",
      category: "offer",
      offerKey: "microneedling-tier-2",
      title: "Microneedling Tier 2 price",
      body: "Tier 2 - Regeneration & Repair — $199 (normally $250) — MOST POPULAR, their best-selling tier",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-2.description",
      category: "offer",
      offerKey: "microneedling-tier-2",
      title: "Microneedling Tier 2 details",
      body:
        "Everything in Tier 1 + PDRN (salmon DNA) regenerative complex, peptides, exosome infusion. ~60 min, full face. Best for: acne scarring, uneven texture, wanting deeper repair not just hydration.",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-2.booking-url",
      category: "booking",
      offerKey: "microneedling-tier-2",
      title: "Microneedling Tier 2 booking link",
      body:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A28309596&share=true&pId=2547469",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-3.price",
      category: "offer",
      offerKey: "microneedling-tier-3",
      title: "Microneedling Tier 3 price",
      body: "Tier 3 - Advanced Rejuvenation — $400 (normally $650)",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-3.description",
      category: "offer",
      offerKey: "microneedling-tier-3",
      title: "Microneedling Tier 3 details",
      body:
        "Everything in Tier 2 + ASCE+ advanced exosome technology. ~60-75 min, full face. Best for: wanting the most intensive, longest-lasting in-clinic result.",
    },
    {
      entryKey: "glam-and-glow.microneedling-tier-3.booking-url",
      category: "booking",
      offerKey: "microneedling-tier-3",
      title: "Microneedling Tier 3 booking link",
      body:
        "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services?lid=2829436&eid=4637109&oiid=sv%3A28309599&share=true&pId=2547469",
    },
    {
      entryKey: "glam-and-glow.microneedling.shared.base",
      category: "offer",
      title: "Microneedling shared base treatment",
      body:
        "All three tiers use the same base precision microneedling. What changes is the active complex infused. Suitability check always included at consult.",
    },
    {
      entryKey: "glam-and-glow.microneedling.shared.sensation",
      category: "faq",
      title: "Microneedling sensation",
      body:
        "Shared FAQ across all tiers: warm tingling sensation, manageable, bonier areas can feel stronger (adjustable).",
    },
    {
      entryKey: "glam-and-glow.microneedling.shared.downtime",
      category: "faq",
      title: "Microneedling downtime",
      body:
        "No real downtime, mild redness for a few hours - wait until next day for makeup.",
    },
    {
      entryKey: "glam-and-glow.microneedling.shared.results",
      category: "faq",
      title: "Microneedling results",
      body:
        "Results: hydration/texture improvement within 1-2 weeks, full collagen remodelling over 4-6 weeks, higher tiers generally more visible/longer-lasting.",
    },
    {
      entryKey: "glam-and-glow.microneedling.shared.contraindications",
      category: "faq",
      title: "Microneedling contraindications",
      body:
        "Not suitable for: active acne breakouts, certain skin conditions, pregnancy, some medications - always flagged at consult. Can combine with anti-wrinkle/filler but timing matters, mention at consult.",
    },
    {
      entryKey: "glam-and-glow.microneedling.tier-selection",
      category: "policy",
      title: "Choosing the right microneedling tier",
      body:
        "If a customer isn't sure which tier they want, help them choose using the \"best for\" descriptions above rather than defaulting to the cheapest or most expensive - match to what they've actually described wanting. Unsure which microneedling tier (customer describes a skin concern but hasn't named a tier, or asks \"which one should I get\"): use the \"best for\" guide in the offer info to recommend one tier based on what they've described - don't just list all three and make them choose blind. If they describe scarring or texture issues, that's a natural fit for Tier 2 (the most popular/best-value option); if they just want a quick glow refresh, Tier 1; if they want the most intensive result, Tier 3. Make a clear recommendation, then invite the booking for that tier.",
    },
    {
      entryKey: "glam-and-glow.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, manual close",
      body:
        "Theo books manually once a day/time is confirmed in the thread. Ask a direct scheduling question, don't just send the link and hope. Example shape: \"We've got a spot Tues arvo or Thurs morning this week, what suits you?\" Get a real answer (day + rough time). For microneedling, make sure the correct tier's link is the one referenced once the customer has confirmed which tier they want. Once they confirm a day/time, let them know you'll lock it in - Theo takes it from there.",
    },
    {
      entryKey: "glam-and-glow.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "glam-and-glow.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never drafts as if it's sending automatically - every output is for Theo to review. Never negotiates price or discounts beyond what's listed in the offers above. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never books or references the wrong microneedling tier link once a tier has been chosen. Never defaults to a tier without matching it to what the customer described - always makes a reasoned recommendation, not a guess. Never guesses which offer a message relates to without checking - asks Theo if unclear.",
    },
    {
      entryKey: "glam-and-glow.policy.outside-scope",
      category: "policy",
      title: "Outside scope enquiries",
      body:
        "Outside scope (medical suitability beyond what's listed above, refund/complaint, price negotiation, anything angry or upset): draft a holding reply that doesn't overcommit, and flag clearly at the top: \"FLAG: outside scope - review before sending.\" Do not attempt to resolve complaints or negotiate price. Do not answer medical questions not covered in the offer info above - suggest they raise it at consult or call the clinic directly (0439 316 011).",
    },
    {
      entryKey: "glam-and-glow.policy.unmatched-offer",
      category: "policy",
      title: "Enquiry does not match an offer",
      body:
        "KNOWN GAP: if a customer's enquiry doesn't clearly match the HIFU offer or one of the three microneedling tiers, don't guess - ask Theo which campaign this is before drafting.",
    },
    {
      entryKey: "glam-and-glow.policy.hesitant-objection",
      category: "policy",
      title: "Hesitant or objection messages",
      body:
        "Hesitant / objection (\"thinking about it\", \"is it worth it\", \"does it actually work\"): brief reassurance using proof points already in the offer info (reviews, 5.0 rating, Ola's experience/international training, clinical-grade device vs salon-grade comparison for microneedling). Don't argue. One line of value, then invite the booking.",
    },
  ],
  sourceAssertions: [
    "$289",
    "$120",
    "$200",
    "$199",
    "$250",
    "$400",
    "$650",
    "https://www.fresha.com/book-now/glam-and-glow-by-ola-ygqu08iw/services",
    "0439 316 011",
    "PDRN (salmon DNA)",
  ],
  importGaps: ["do_not_answer_list", "compliance_block"],
  importNotes: [],
};
