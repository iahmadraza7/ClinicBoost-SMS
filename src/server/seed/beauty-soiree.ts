import type { AnswerMode, KbCategory } from "../db/schema";

/**
 * Beauty Soiree, transcribed from knowledge-source/converted/beauty-soiree.md.
 *
 * Every `body` below is text lifted from that file. Nothing here is invented.
 * The one exception is `blockDeflect`, which turns the file's instruction ("a
 * short honest deflect to Lisa: she'll answer it properly by text, or it gets
 * covered at the appointment") into the actual sentence to send. Those five
 * lines are the client's to review.
 *
 * The general importer arrives with the knowledge base editor. This clinic is
 * seeded explicitly because it is the single end-to-end test clinic and its
 * do-not-answer list is what exercises the validator.
 */

export const CLINIC = {
  slug: "beauty-soiree",
  name: "Beauty Soiree (Beauty Soiree Medispa, Brisbane)",
  location: "2/440 Samford Rd, Gaythorne QLD 4051 (Brisbane)",
  // "HOURS: NOT CONFIRMED - do not state opening hours."
  hours: null,
  phone: "0405 087 121",
  paymentNotes: "Afterpay available on both offers.",
  bookingPlatform: "timely" as const,
  // "Timely - self-serve, instantly confirmed... Link-only close."
  closeType: "link_only" as const,
  confidenceThreshold: 90,
  widgetOrigins: [
    "https://offers.thebeautysoiree.com.au",
    "http://offers.thebeautysoiree.com.au",
  ],
};

export const OFFERS = [
  {
    key: "hifu-499",
    name: "HIFU Lower Face, Jaw & Neck Lift",
    priceCents: 49900,
    priceDisplay: "$499",
    rrpDisplay: "$999",
    bookingUrl: "http://offers.thebeautysoiree.com.au/hifu-499",
    notes: "normally $999, limited time",
  },
  {
    key: "pmu-399",
    name: "PMU Brows, Hyper-Realistic Feather Touch",
    priceCents: 39900,
    priceDisplay: "$399",
    rrpDisplay: null,
    bookingUrl: "http://offers.thebeautysoiree.com.au/pmu-399",
    notes: "50% off, INTRO OFFER for new clients only",
  },
];

export type SeedEntry = {
  entryKey: string;
  category: KbCategory;
  offerKey?: string;
  title: string;
  body: string;
  answerMode?: AnswerMode;
  blockDeflect?: string;
  /**
   * How the validator recognises that this topic has come up. Drawn from the
   * wording of the "Unconfirmed - do not answer" list itself. Only the blocked
   * entries need these; an answerable entry is matched by citation.
   */
  triggerTerms?: string[];
};

const DEFLECT_TO_LISA =
  "That one is best answered by Lisa directly. Text or call her on 0405 087 121 and she will sort you out, or it gets covered at your appointment.";

export const ENTRIES: SeedEntry[] = [
  // --- Clinic config ---------------------------------------------------------
  {
    entryKey: "beauty-soiree.config.clinic-name",
    category: "config",
    title: "Clinic name",
    body: "Beauty Soiree (Beauty Soiree Medispa, Brisbane)",
  },
  {
    entryKey: "beauty-soiree.config.location",
    category: "config",
    title: "Location",
    body: "2/440 Samford Rd, Gaythorne QLD 4051 (Brisbane)",
  },
  {
    entryKey: "beauty-soiree.config.phone",
    category: "config",
    title: "Phone",
    body: "0405 087 121 (Lisa direct - text or call)",
  },
  {
    entryKey: "beauty-soiree.config.payment",
    category: "config",
    title: "Payment",
    body: "Afterpay available on both offers.",
  },
  {
    entryKey: "beauty-soiree.config.therapist",
    category: "config",
    title: "Therapist",
    body:
      "Lisa Jenkins - Founder & Lead Ultraformer III Specialist. Portrait artist for over a decade before moving into aesthetics. 5 years aesthetics experience, advanced Ultraformer III training, 100+ Ultraformer III treatments, zero complications record. Brows: fine artist turned brow specialist, 300+ brow clients.",
  },
  {
    entryKey: "beauty-soiree.config.booking-platform",
    category: "booking",
    title: "Booking platform",
    body:
      "Timely - self-serve, instantly confirmed the moment the customer picks a slot. No manual approval, no clinic confirmation step. Link-only close.",
  },
  {
    entryKey: "beauty-soiree.config.hours",
    category: "config",
    title: "Opening hours",
    body:
      "NOT CONFIRMED - do not state opening hours. If asked, point them at the booking link (\"all the available times are in here\") or tell them to text Lisa on 0405 087 121.",
    answerMode: "blocked",
    blockDeflect:
      "All the available times are in the booking link, so you can pick whatever suits. If you want to check something specific, text Lisa on 0405 087 121.",
    triggerTerms: [
      "opening hours",
      "open hours",
      "trading hours",
      "what time do you open",
      "what time do you close",
      "are you open",
      "opening time",
      "closing time",
    ],
  },

  // --- Offer 1: HIFU ---------------------------------------------------------
  {
    entryKey: "beauty-soiree.hifu-499.price",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU price",
    body:
      "HIFU Lower Face, Jaw & Neck Lift - $499 (normally $999, limited time)",
  },
  {
    entryKey: "beauty-soiree.hifu-499.device",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU device",
    body:
      "Ultraformer III, TGA-approved #267732. Four depths: 1.5mm, 2.0mm, 3.0mm, 4.5mm. 4.5mm reaches the SMAS layer (the layer surgeons target in a facelift)",
  },
  {
    entryKey: "beauty-soiree.hifu-499.duration",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU appointment length",
    body:
      "60-minute treatment, one session. Lisa maps the face individually rather than running a generic protocol",
  },
  {
    entryKey: "beauty-soiree.hifu-499.downtime",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU downtime",
    body: "Zero downtime, immediate return to normal activities",
  },
  {
    entryKey: "beauty-soiree.hifu-499.results",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU results timeline",
    body:
      "Results: build from around 8 weeks, peak 8-14 weeks as collagen regenerates, last 12+ months",
  },
  {
    entryKey: "beauty-soiree.hifu-499.price-contrast",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU price objection contrast",
    body:
      "Contrast point (use sparingly, softened): budget clinics run single-depth devices at 1.5mm max in 20-minute appointments and sell 3-session packages at ~$299 each ($897 total). Frame as \"budget HIFU\" or \"single-depth\", never as a scam",
  },
  {
    entryKey: "beauty-soiree.hifu-499.payment",
    category: "offer",
    offerKey: "hifu-499",
    title: "HIFU payment",
    body: "Afterpay available",
  },
  {
    entryKey: "beauty-soiree.hifu-499.booking-url",
    category: "booking",
    offerKey: "hifu-499",
    title: "HIFU booking link",
    body: "http://offers.thebeautysoiree.com.au/hifu-499",
  },
  {
    entryKey: "beauty-soiree.hifu-499.pain",
    category: "faq",
    offerKey: "hifu-499",
    title: "Does HIFU hurt",
    body:
      "Does it hurt: NOT CONFIRMED - do not answer this. Listed under \"Unconfirmed - do not answer\".",
    answerMode: "blocked",
    blockDeflect: DEFLECT_TO_LISA,
    triggerTerms: [
      "hurt",
      "hurts",
      "painful",
      "painless",
      "pain",
      "sore",
      "ouch",
      "feel like",
      "feels like",
      "discomfort",
      "uncomfortable",
    ],
  },
  {
    entryKey: "beauty-soiree.hifu-499.suitability",
    category: "faq",
    offerKey: "hifu-499",
    title: "HIFU contraindications and suitability",
    body:
      "HIFU contraindications and suitability (pregnancy, implants, pacemakers, fillers, skin conditions): NOT CONFIRMED - do not answer.",
    answerMode: "blocked",
    blockDeflect: DEFLECT_TO_LISA,
    triggerTerms: [
      "pregnant",
      "pregnancy",
      "implant",
      "implants",
      "pacemaker",
      "pacemakers",
      "contraindication",
      "contraindications",
      "suitable",
      "suitability",
      "safe for me",
      "skin condition",
      "skin conditions",
    ],
  },

  // --- Offer 2: PMU brows ----------------------------------------------------
  {
    entryKey: "beauty-soiree.pmu-399.price",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows price",
    body:
      "PMU Brows, Hyper-Realistic Feather Touch - $399 (50% off, INTRO OFFER for new clients only)",
  },
  {
    entryKey: "beauty-soiree.pmu-399.technique",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows technique",
    body:
      "Feather Touch technique, not microblading. Gentler and less invasive, softer natural hair strokes, no harsh lines or blocky look",
  },
  {
    entryKey: "beauty-soiree.pmu-399.artist",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows artist and mapping",
    body:
      "Performed by Lisa, portrait artist background. Brow shape is mapped and approved by the customer before any tattooing starts",
  },
  {
    entryKey: "beauty-soiree.pmu-399.duration",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows appointment length",
    body: "Initial appointment approx 2 hours. Never rushed",
  },
  {
    entryKey: "beauty-soiree.pmu-399.touch-up",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows touch-up",
    body: "Minor touch-up session 6 weeks later to finish the result",
  },
  {
    entryKey: "beauty-soiree.pmu-399.healing",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows healing",
    body:
      "Healing: 7-10 days, minimal discomfort, most heal without scabbing thanks to Lisa's light-handed approach",
  },
  {
    entryKey: "beauty-soiree.pmu-399.numbing",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows numbing",
    body:
      "Numbing: a prescription for compounding pharmacy numbing cream is sent on booking, professional strength, comfortable for most clients",
  },
  {
    entryKey: "beauty-soiree.pmu-399.results",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows results",
    body:
      "Results: typically 12 months before a touch-up is needed. Most clients then book the 6-month refresh at 50% off",
  },
  {
    entryKey: "beauty-soiree.pmu-399.intro-rate",
    category: "policy",
    offerKey: "pmu-399",
    title: "PMU brows intro rate caveat",
    body:
      "IMPORTANT: $399 is the 50% intro rate for new clients, not the standard ongoing price. Do not imply it applies to repeat work or future sessions",
  },
  {
    entryKey: "beauty-soiree.pmu-399.payment",
    category: "offer",
    offerKey: "pmu-399",
    title: "PMU brows payment",
    body: "Afterpay: 4 payments of $99.75",
  },
  {
    entryKey: "beauty-soiree.pmu-399.booking-url",
    category: "booking",
    offerKey: "pmu-399",
    title: "PMU brows booking link",
    body: "http://offers.thebeautysoiree.com.au/pmu-399",
  },
  {
    entryKey: "beauty-soiree.pmu-399.touch-up-included",
    category: "faq",
    offerKey: "pmu-399",
    title: "Is the 6-week PMU touch-up included in the $399",
    body:
      "Whether the 6-week PMU touch-up is included in the $399 or charged separately: NOT CONFIRMED - do not answer.",
    answerMode: "blocked",
    blockDeflect: DEFLECT_TO_LISA,
    triggerTerms: [
      "touch up included",
      "touch-up included",
      "included in the price",
      "charged separately",
      "cost extra",
      "costs extra",
      "extra charge",
      "free touch up",
      "free touch-up",
    ],
  },
  {
    entryKey: "beauty-soiree.pmu-399.suitability",
    category: "faq",
    offerKey: "pmu-399",
    title: "PMU brows contraindications and suitability",
    body:
      "PMU brow contraindications and suitability (pregnancy, breastfeeding, blood thinners, keloid scarring, skin conditions): NOT CONFIRMED - do not answer.",
    answerMode: "blocked",
    blockDeflect: DEFLECT_TO_LISA,
    triggerTerms: [
      "breastfeeding",
      "breastfeed",
      "blood thinner",
      "blood thinners",
      "keloid",
      "keloid scarring",
      "allergic",
      "allergy",
    ],
  },

  // --- Policy ----------------------------------------------------------------
  {
    entryKey: "beauty-soiree.policy.close-mechanics",
    category: "policy",
    title: "Booking mechanics, link-only close",
    body:
      "Booking is self-serve and instantly confirmed the moment the customer picks a slot. Never say Lisa will confirm, get back to them, or hold a spot. Give the link with a direct instruction, not a bare drop. Use only the urgency already on the landing pages, do not invent deadlines or spot counts. If they cannot find a suitable time, hand off: text or call Lisa on 0405 087 121.",
  },
  {
    entryKey: "beauty-soiree.policy.compliance-claims",
    category: "policy",
    title: "Compliance rules for every draft",
    body:
      "Never promise or guarantee results. \"Results vary\" is the honest baseline. Never call HIFU results permanent, 12+ months is the claim. Device names must be exact: Ultraformer III, TGA-approved #267732. \"Non-invasive\" and \"no downtime\" for HIFU are accurate and can be used. No before/after claims beyond what the landing pages already state.",
  },
  {
    entryKey: "beauty-soiree.policy.sms-format",
    category: "policy",
    title: "SMS formatting rules",
    body:
      "No emojis. No em dashes, use full stops or commas instead. No special or smart characters. Keep it as short as the question allows, match the customer's message length and pace. Plain, casual Australian tone. No signoffs. One question per message where possible.",
  },
  {
    entryKey: "beauty-soiree.policy.no-negotiation",
    category: "policy",
    title: "What this clinic never does",
    body:
      "Never negotiates price or discounts beyond what is listed in the offers. Never handles refund or complaint messages beyond a holding reply plus flag. Never implies the $399 brow intro rate is the standard ongoing price. Never implies HIFU results are permanent or guaranteed. Never says Lisa will confirm the booking, Timely confirms instantly.",
  },
  {
    entryKey: "beauty-soiree.policy.unmatched-offer",
    category: "policy",
    title: "Enquiry does not match either offer",
    body:
      "KNOWN GAP: if a customer's enquiry doesn't clearly match one of these two offers, or references a price or treatment that doesn't match either (e.g. full face HIFU, CLATUU fat freezing, a $289 or $999 price), don't guess.",
    answerMode: "blocked",
    blockDeflect:
      "Let me check which offer that is about and come straight back to you.",
  },
];

/**
 * Strings that must appear verbatim in the converted source file. If the client
 * updates a landing page and reconverts, a changed price or link fails the seed
 * loudly instead of drifting out of sync in silence.
 */
export const SOURCE_ASSERTIONS = [
  "$499",
  "$999",
  "$399",
  "$99.75",
  "http://offers.thebeautysoiree.com.au/hifu-499",
  "http://offers.thebeautysoiree.com.au/pmu-399",
  "0405 087 121",
  "Ultraformer III, TGA-approved #267732",
  "Unconfirmed - do not answer",
];
