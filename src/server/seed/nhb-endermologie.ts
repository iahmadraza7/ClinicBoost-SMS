import type { ClinicSeedPack } from "./types";

/**
 * NHB Endermologie, transcribed from
 * knowledge-source/converted/nhb-endermologie.md.
 *
 * Structure normalised by hand. Booking platform and close type are mentioned
 * in the Booking Process section but not set as clinic config - left null.
 */

export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/nhb-endermologie.md",
  clinic: {
    slug: "nhb-endermologie",
    name: "Natural Health & Beauty w Endermologie",
    location:
      "99 Brewer Rd, Level 1, T/02 Maybloom, Bentleigh VIC 3204",
    hours: null,
    phone: null,
    paymentNotes: "A deposit is required to secure any booking",
    bookingPlatform: null,
    closeType: null,
    confidenceThreshold: 90,
    widgetOrigins: [],
  },
  offers: [
    {
      key: "hifu-289",
      name: "HIFU Full Face & Neck Refresh",
      priceCents: 28900,
      priceDisplay: "$289",
      rrpDisplay: "$899",
      bookingUrl: "https://offers.nhbendermologie.com.au/book-hifu",
      notes: "single-depth 1.5mm Refresh",
    },
    {
      key: "upgrade-649",
      name: "Multi-Depth Upgrade",
      priceCents: 64900,
      priceDisplay: "$649",
      rrpDisplay: "$1000",
      bookingUrl: "https://offers.nhbendermologie.com.au/book-hifu",
      notes: "covers 1.5mm, 3.0mm and 4.5mm layers",
    },
  ],
  entries: [
    // --- Clinic config ---------------------------------------------------------
    {
      entryKey: "nhb-endermologie.config.location",
      category: "config",
      title: "Location",
      body: "99 Brewer Rd, Level 1, T/02 Maybloom, Bentleigh VIC 3204",
    },
    {
      entryKey: "nhb-endermologie.config.nearest-station",
      category: "config",
      title: "Nearest train station",
      body: "Bentleigh Station (Frankston line)",
    },
    {
      entryKey: "nhb-endermologie.config.deposit",
      category: "config",
      title: "Deposit requirement",
      body:
        "A deposit is required to secure any booking - correct customers who assume they can pay on the day.",
    },

    // --- Policy: booking and message format ------------------------------------
    {
      entryKey: "nhb-endermologie.policy.booking-process",
      category: "policy",
      title: "Booking process",
      body:
        "Booking platform is Fresha. Bookings are normally taken manually by Theo/clinic staff - default to asking for a preferred date/time rather than sending a self-serve link. Booking link (offers.nhbendermologie.com.au/book-hifu) can be used when it makes contextual sense - e.g. clinic is busy, customer wants to self-serve, or Theo explicitly says to send it. Don't default to it for every enquiry. A deposit is required to secure any booking - correct customers who assume they can pay on the day.",
    },
    {
      entryKey: "nhb-endermologie.policy.message-format",
      category: "policy",
      title: "Message format rules",
      body:
        "All replies must start with \"NHB Endermologie: \". No emojis, no special characters. Aim for under 160 characters where possible to avoid multi-segment billing (not always achievable with detailed answers).",
    },

    // --- Offer: HIFU Refresh $289 ----------------------------------------------
    {
      entryKey: "nhb-endermologie.hifu-289.price",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU Refresh price",
      body: "HIFU Full Face & Neck Refresh, $289 (usually $899, confirmed genuinely charged)",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.device",
      category: "offer",
      offerKey: "hifu-289",
      title: "HIFU device",
      body:
        "Focus Dual (Eunsung Global Corp / Clinimed Aesthetics Pty Ltd, sponsor) - TGA Registered, ARTG 371470. Confirmed active/live on the TGA register as of 30 July 2026. Use \"TGA Registered\" only - never \"TGA approved/listed/certified.\"",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.device-positioning",
      category: "offer",
      offerKey: "hifu-289",
      title: "Device positioning",
      body:
        "Korean-engineered, clinical-grade - explicitly not salon-grade \"D\" equipment (7D/9D/11D/14D/4D etc. are salon marketing terms for cheaper machines, a key differentiator vs NHB)",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.depth",
      category: "offer",
      offerKey: "hifu-289",
      title: "Refresh treatment depth",
      body:
        "$289 Refresh depth: single-depth, 1.5mm (dermis layer) - targets skin tightening/texture. Cannot claim \"targets SMAS\" at this depth.",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.duration",
      category: "offer",
      offerKey: "hifu-289",
      title: "Session duration",
      body: "Session duration: ~60 mins total (treatment + consult)",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.maintenance",
      category: "offer",
      offerKey: "hifu-289",
      title: "Maintenance interval",
      body: "Maintenance: recommended at 6-12 months, depending on skin/response",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.sessions-needed",
      category: "offer",
      offerKey: "hifu-289",
      title: "Number of treatments",
      body:
        "Number of treatments needed: varies by client - some happy with one session, then maintenance at 6-12 months. Consult beforehand sets expectations. Don't quote a fixed number.",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.shot-count",
      category: "offer",
      offerKey: "hifu-289",
      title: "Shot count",
      body:
        "Shot/line count: clinic has confirmed ~400 shots for the full Face & Neck treatment. Exact \"line\" count not documented - don't invent a number if asked specifically about lines",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.staff",
      category: "offer",
      offerKey: "hifu-289",
      title: "Staff",
      body:
        "Staff who can perform treatment: 5 trained staff members, all extensively trained on the machine. Named clinicians: Piumi and Sara (Senior Dermal Clinicians, Bachelor of Dermal Sciences), Van and Ellie (dermal clinicians/beauty therapists). Don't name a specific individual as \"who will treat you\" unless Theo confirms rostering.",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.terminology",
      category: "offer",
      offerKey: "hifu-289",
      title: "Terminology",
      body: "Terminology: use \"clinical-grade,\" never \"medical-grade.\"",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.positioning",
      category: "offer",
      offerKey: "hifu-289",
      title: "Refresh positioning",
      body:
        "Positioning: the $289 Refresh should read as a complete, valuable standalone treatment - not \"step one\" or \"entry-level\" - with multi-depth as an upgrade option for clients wanting deeper results.",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.booking-url",
      category: "booking",
      offerKey: "hifu-289",
      title: "Booking link",
      body: "https://offers.nhbendermologie.com.au/book-hifu",
    },

    // --- Offer: Multi-depth upgrade $649 ---------------------------------------
    {
      entryKey: "nhb-endermologie.upgrade-649.price",
      category: "offer",
      offerKey: "upgrade-649",
      title: "Multi-depth upgrade price",
      body: "Multi-depth upgrade: $649 (usually $1000)",
    },
    {
      entryKey: "nhb-endermologie.upgrade-649.depth",
      category: "offer",
      offerKey: "upgrade-649",
      title: "Multi-depth layers",
      body:
        "Multi-depth upgrade: $649 (usually $1000) - covers all 3 layers: 1.5mm dermis, 3.0mm subcutaneous fat, 4.5mm SMAS (the layer enabling genuine \"targets SMAS\"/deeper lifting claims). Frame as a personalised upgrade for deeper laxity, never as the \"real\" treatment vs. the $289 being lesser.",
    },
    {
      entryKey: "nhb-endermologie.upgrade-649.booking-url",
      category: "booking",
      offerKey: "upgrade-649",
      title: "Booking link",
      body: "https://offers.nhbendermologie.com.au/book-hifu",
    },

    // --- Contraindications -----------------------------------------------------
    {
      entryKey: "nhb-endermologie.hifu-289.dental-implants",
      category: "faq",
      offerKey: "hifu-289",
      title: "Dental implants contraindication",
      body:
        "Dental implants: CONFIRMED contraindication - HIFU is not suitable for clients with dental implants due to the treatment areas involved. Reply directly with this if asked (no need to defer further).",
    },
    {
      entryKey: "nhb-endermologie.hifu-289.pacemakers",
      category: "faq",
      offerKey: "hifu-289",
      title: "Pacemakers and implants near treatment area",
      body:
        "Pacemakers/other implants near treatment area: defer to clinician check, don't confirm eligibility over SMS.",
      answerMode: "blocked",
      blockDeflect:
        "That needs a clinician to check for your specific situation. Best to raise it when you book or at consult so they can confirm.",
      triggerTerms: [
        "pacemaker",
        "pacemakers",
        "implant near",
        "implants near",
        "metal implant",
        "metal implants",
      ],
    },
    {
      entryKey: "nhb-endermologie.hifu-289.treatment-combination",
      category: "faq",
      offerKey: "hifu-289",
      title: "Combining with other treatments",
      body:
        "Any combination with other treatments (e.g. skin needling/microneedling): general skincare guidance suggests 2-4 weeks spacing between different active treatments, but defer exact timing to clinician for the specific case.",
      answerMode: "blocked",
      blockDeflect:
        "Spacing depends on what else you're having done. Best to check with the clinician on your specific case when you book.",
      triggerTerms: [
        "combine",
        "combining",
        "skin needling",
        "microneedling",
        "after my",
        "before my",
        "same time as",
        "how long between",
        "spacing",
      ],
    },

    // --- Known gaps (policy instructions) --------------------------------------
    {
      entryKey: "nhb-endermologie.policy.known-gap-line-count",
      category: "policy",
      title: "Known gap: exact line count",
      body:
        "Exact \"line\" count per treatment (only shot count ~400 confirmed) - flag to Theo rather than guess.",
    },
    {
      entryKey: "nhb-endermologie.policy.known-gap-longevity",
      category: "policy",
      title: "Known gap: result duration numbers",
      body:
        "Precise result duration/longevity numbers - flag to Theo rather than guess.",
    },
    {
      entryKey: "nhb-endermologie.policy.known-gap-clinical",
      category: "policy",
      title: "Known gap: other clinical questions",
      body:
        "Any other new clinical or technical question not covered above - don't invent specifics, get clinician confirmation and update this file once known.",
    },
  ],
  sourceAssertions: [
    "$289",
    "$899",
    "$649",
    "$1000",
    "ARTG 371470",
    "Focus Dual",
    "~400 shots",
    "offers.nhbendermologie.com.au/book-hifu",
    "NHB Endermologie: ",
    "99 Brewer Rd",
  ],
  importGaps: [
    "booking_platform",
    "close_type",
    "do_not_answer_list",
    "compliance_block",
    "widget_origins",
  ],
  importNotes: [
    "Skill file uses a different structure; normalised by hand.",
    "Fresha mentioned in Booking Process but booking platform and close type not set in Clinic Config - operator must choose.",
    "No phone number in skill file.",
  ],
};
