import type { ClinicSeedPack } from "./types";

/**
 * Luxury Brows Perth, transcribed from
 * knowledge-source/converted/luxury-brows-perth.md.
 *
 * Every `body` below is text lifted from that file. Nothing here is invented.
 * `blockDeflect` lines turn file instructions into the sentence to send.
 */

export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/luxury-brows-perth.md",
  clinic: {
    slug: "luxury-brows-perth",
    name: "Luxury Brows Perth",
    location: "1C Sunray Dr, Innaloo WA 6018",
    hours: null,
    phone: "0488 559 378",
    paymentNotes: "Afterpay available, 4 payments of $99.75",
    bookingPlatform: "fresha",
    closeType: "manual",
    confidenceThreshold: 90,
    widgetOrigins: [],
  },
  offers: [
    {
      key: "pmu-399",
      name: "Hyper-Realistic Brows (PMU)",
      priceCents: 39900,
      priceDisplay: "$399",
      rrpDisplay: "$798",
      bookingUrl:
        "https://www.fresha.com/book-now/luxury-brows-mbc6s7s6/services?lid=2736871&eid=4829272&oiid=sv%3A24678444&share=true&pId=2647972",
      notes: "intro offer for new clients",
    },
  ],
  entries: [
    // --- Clinic config ---------------------------------------------------------
    {
      entryKey: "luxury-brows-perth.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Luxury Brows Perth",
    },
    {
      entryKey: "luxury-brows-perth.config.location",
      category: "config",
      title: "Location",
      body: "1C Sunray Dr, Innaloo WA 6018",
    },
    {
      entryKey: "luxury-brows-perth.config.phone",
      category: "config",
      title: "Phone",
      body:
        "0488 559 378 (Kristie - clinic owner, can also be given to customers directly for questions or scheduling issues)",
    },
    {
      entryKey: "luxury-brows-perth.config.artist",
      category: "config",
      title: "Artist",
      body:
        "Kristie - certified Phi Brow Artist, qualified dermal therapist, 10+ years experience",
    },
    {
      entryKey: "luxury-brows-perth.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Fresha - Theo books manually once a day/time is confirmed in the thread",
    },

    // --- Offer: PMU brows ------------------------------------------------------
    {
      entryKey: "luxury-brows-perth.pmu-399.price",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows price",
      body:
        "Hyper-Realistic Brows (PMU) - $399 (normally $798, intro offer for new clients)",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.technique",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows technique",
      body:
        "Feather Touch technique - hand-drawn ultra-fine strokes mimicking real brow hairs, no harsh lines or block colour",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.duration",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows appointment length",
      body: "Appointment length: ~2 hours for the main session",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.sessions",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows sessions",
      body:
        "Sessions needed: one main appointment + a minor touch-up 6 weeks later (included, not an extra charge based on page copy)",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.numbing",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows numbing",
      body: "Numbing gel used - most clients find it very comfortable",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.results",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows results",
      body: "Results last ~12 months before a touch-up is needed",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.upsell",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows 12-month refresh upsell",
      body:
        "UPSELL (existing/past clients only): 12-month refresh available at 30% off - only relevant if someone mentions having had it done before, not for first-time enquiries",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.healing",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows healing",
      body:
        "Healing: 7-10 days, minimal discomfort, low scarring risk with Kristie's technique per page copy",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.shape",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows shape and design",
      body:
        "Shape/design: brow shape is mapped and approved with the customer before any tattooing begins - customer has say before anything happens",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.payment",
      category: "offer",
      offerKey: "pmu-399",
      title: "PMU brows payment",
      body: "Afterpay available, 4 payments of $99.75",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.booking-url",
      category: "booking",
      offerKey: "pmu-399",
      title: "PMU brows booking link",
      body:
        "https://www.fresha.com/book-now/luxury-brows-mbc6s7s6/services?lid=2736871&eid=4829272&oiid=sv%3A24678444&share=true&pId=2647972",
    },
    {
      entryKey: "luxury-brows-perth.pmu-399.suitability",
      category: "faq",
      offerKey: "pmu-399",
      title: "PMU brows contraindications and suitability",
      body:
        "Not suitable for: page doesn't specify contraindications explicitly - if asked about pregnancy, skin conditions, allergies, or medications (e.g. blood thinners), don't guess, flag to Theo or suggest they raise it with Kristie directly",
      answerMode: "blocked",
      blockDeflect:
        "Best to run that past Kristie directly so she can give you a proper answer. Text or call her on 0488 559 378.",
      triggerTerms: [
        "pregnant",
        "pregnancy",
        "skin condition",
        "skin conditions",
        "allerg",
        "allergies",
        "blood thinner",
        "blood thinners",
        "medication",
        "medications",
        "suitable",
        "suitability",
        "contraindication",
      ],
    },

    // --- Policy ----------------------------------------------------------------
    {
      entryKey: "luxury-brows-perth.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, manual close",
      body:
        "Theo books manually once a day/time is confirmed in the thread. Ask a direct scheduling question, don't just send the link and hope. Example shape: \"We've got a spot Tues arvo or Thurs morning this week at Innaloo, what suits you?\" Get a real answer (day + rough time). Once they confirm, let them know you'll lock it in - Theo takes it from there. Remember appointments are ~2 hours, so if a customer proposes a very tight time window, it's worth confirming they can allow for that.",
    },
    {
      entryKey: "luxury-brows-perth.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "luxury-brows-perth.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never negotiates price or discounts beyond what's listed in the offer above. Never answers medical/contraindication questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never invents details for the unconfirmed HIFU/face lift offer fragment on the landing page. Never guesses shape, colour, or design preferences on Kristie's behalf - that's confirmed in person.",
    },
    {
      entryKey: "luxury-brows-perth.policy.hifu-known-gap",
      category: "policy",
      title: "Known gap: unconfirmed HIFU offer on landing page",
      body:
        "KNOWN GAP - DO NOT GUESS: the landing page also contains a second, seemingly unrelated CTA for a \"$289 Non-Surgical Face & Neck Lift\" using HIFU language, pointing at the same Fresha link as the brow offer. This looks like leftover template content and has not been confirmed as a real, separate Luxury Brows Perth offer. If a customer's message references HIFU, face/neck lift, or a $289 price at this clinic, do not draft using guessed details - flag it.",
      answerMode: "blocked",
      blockDeflect:
        "Let me check which offer that is about and come straight back to you.",
      triggerTerms: [
        "hifu",
        "face lift",
        "face and neck lift",
        "neck lift",
        "non-surgical",
        "$289",
        "289",
        "face and neck",
      ],
    },
  ],
  sourceAssertions: [
    "$399",
    "$798",
    "$99.75",
    "$289",
    "0488 559 378",
    "1C Sunray Dr, Innaloo WA 6018",
    "Hyper-Realistic Brows",
    "fresha.com/book-now/luxury-brows",
  ],
  importGaps: [
    "do_not_answer_list",
    "compliance_block",
    "widget_origins",
    "hours",
  ],
  importNotes: [
    "Landing page contains an unconfirmed HIFU/$289 CTA fragment; seeded as a blocked policy entry until Theo confirms.",
    "Opening hours not in the skill file.",
  ],
};
