import type { ClinicSeedPack } from "./types";

/**
 * Gem Esthetics, transcribed from knowledge-source/converted/gem-esthetics.md.
 * Every body is lifted from that file; nothing invented.
 */
export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/gem-esthetics.md",
  clinic: {
    slug: "gem-esthetics",
    name: "Gem Esthetics",
    location: "Sunshine Coast, QLD (specific address not stated on landing page)",
    hours: null,
    phone: null,
    paymentNotes: null,
    bookingPlatform: "timely",
    closeType: "link_only",
    confidenceThreshold: 90,
    widgetOrigins: [],
  },
  offers: [
    {
      key: "hifu-289",
      name: "HIFU Full Face Instant Refresh",
      priceCents: 28900,
      priceDisplay: "$289",
      rrpDisplay: "$999",
      bookingUrl:
        "https://bookings.gettimely.com/gemesthetics/bb/book?category=636072&product=4855814%3ASV",
      notes: "normally $999, introductory offer",
    },
  ],
  entries: [
    {
      entryKey: "gem-esthetics.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Gem Esthetics",
    },
    {
      entryKey: "gem-esthetics.config.location",
      category: "config",
      title: "Location",
      body: "Sunshine Coast, QLD (specific address not stated on landing page)",
    },
    {
      entryKey: "gem-esthetics.config.therapist",
      category: "config",
      title: "Therapist",
      body: "Gemma - owner, 10+ years experience",
    },
    {
      entryKey: "gem-esthetics.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Timely - link-only close, Theo does not book manually. Make the link irresistible to click.",
    },
    {
      entryKey: "gem-esthetics.hifu-289.price",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU refresh price",
      body:
        "HIFU Full Face Instant Refresh — $289 (normally $999, introductory offer)",
    },
    {
      entryKey: "gem-esthetics.hifu-289.device",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU device",
      body: "Custom 16D HIFU system, therapist-performed",
    },
    {
      entryKey: "gem-esthetics.hifu-289.treatment-level",
      category: "policy",
      offerKey: "hifu-289",
      title: "Entry-level HIFU refresh, not full lift",
      body:
        "IMPORTANT: this is explicitly the lighter/instant refresh, NOT the deeper full-depth HIFU lift. If a customer is asking about a stronger or longer-lasting treatment, be upfront that this is the entry-level version - don't oversell it as equivalent to a full lift",
    },
    {
      entryKey: "gem-esthetics.hifu-289.scope",
      category: "offer",
      offerKey: "hifu-289",
      title: "Face only, neck add-on",
      body:
        "Face only - does NOT include neck. Neck can be added for $99, paid in-clinic (not online, not part of the $289)",
    },
    {
      entryKey: "gem-esthetics.hifu-289.downtime",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU refresh downtime",
      body:
        "Zero downtime, no needles, described as gentle warmth or mild tingling - not painful",
    },
    {
      entryKey: "gem-esthetics.hifu-289.results",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU refresh results",
      body:
        "Results: refreshed/firmer feel immediately, smoother and more lifted over 2-8 weeks as collagen builds",
    },
    {
      entryKey: "gem-esthetics.hifu-289.sessions",
      category: "offer",
      offerKey: "hifu-289",
      title: "Sessions and upgrades",
      body:
        "Sessions: most clients see results from one session. For ongoing sculpting/tightening, some rebook every 3-6 months, or later upgrade to the full-depth HIFU lift (not detailed on this page - if asked for full-lift pricing, don't guess, tell the customer Gemma can go through options at the appointment or flag to Theo)",
    },
    {
      entryKey: "gem-esthetics.hifu-289.suitability",
      category: "policy",
      offerKey: "hifu-289",
      title: "Medical suitability not on page",
      body:
        "No stated medical contraindications on this page - if asked about pregnancy, skin conditions, medications, or other suitability questions, don't guess, flag it",
    },
    {
      entryKey: "gem-esthetics.hifu-289.booking-url",
      category: "booking",
      offerKey: "hifu-289",
      title: "HIFU refresh booking link",
      body:
        "https://bookings.gettimely.com/gemesthetics/bb/book?category=636072&product=4855814%3ASV",
    },
    {
      entryKey: "gem-esthetics.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, link-only close",
      body:
        "There is no manual booking step for this clinic. Once the link is sent, Theo has no further control over whether the customer completes the booking - so the reply has to make clicking it as frictionless and appealing as possible. Minimise perceived steps. Give the link with a direct instruction, not just a drop: \"Easiest way is to grab a spot here: {link}\". If the customer has asked multiple questions across the thread, answer them briefly first, then close with the link - don't lead with the link before their question is answered, it reads as dismissive.",
    },
    {
      entryKey: "gem-esthetics.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "gem-esthetics.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never drafts as if it's sending automatically - every output is for Theo to review. Never negotiates price or discounts beyond what's listed in the offer above. Never implies the neck is included in the $289 - it's a separate $99 in-clinic add-on. Never oversells the $289 refresh as equivalent to the full-depth HIFU lift. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never guesses full-depth lift pricing since it's not stated on this page.",
    },
    {
      entryKey: "gem-esthetics.policy.outside-scope",
      category: "policy",
      title: "Outside scope enquiries",
      body:
        "Outside scope (medical suitability not covered above, questions about the full-depth lift pricing, refund/complaint, price negotiation, anything angry or upset): draft a holding reply that doesn't overcommit, and flag clearly at the top: \"FLAG: outside scope - review before sending.\" Do not attempt to resolve complaints or negotiate price. Do not answer medical questions or full-lift pricing not covered in the offer info above - suggest Gemma can cover it at the appointment, or flag to Theo.",
    },
    {
      entryKey: "gem-esthetics.policy.hesitant-objection",
      category: "policy",
      title: "Hesitant or objection messages",
      body:
        "Hesitant / objection (\"thinking about it\", \"is it worth it\", \"will I actually see a difference\"): brief reassurance using proof points already in the offer info (1,000+ treatments, 5.0 rating, therapist-performed, clinical-grade tech). One line of value, then invite the booking.",
    },
  ],
  sourceAssertions: [
    "$289",
    "$999",
    "$99",
    "https://bookings.gettimely.com/gemesthetics/bb/book",
    "16D HIFU system",
  ],
  importGaps: [
    "do_not_answer_list",
    "compliance_block",
    "hours",
    "phone",
    "widget_origins",
  ],
  importNotes: [
    "Specific street address not stated on the landing page.",
    "Phone number and opening hours not in the skill file.",
    "Widget origins not configured; booking is on Timely.",
  ],
};
