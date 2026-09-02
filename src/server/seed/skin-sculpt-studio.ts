import type { ClinicSeedPack } from "./types";

/**
 * Skin Sculpt Studio, transcribed from
 * knowledge-source/converted/skin-sculpt-studio.md.
 *
 * Every `body` below is text lifted from that file. Nothing here is invented.
 */

export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/skin-sculpt-studio.md",
  clinic: {
    slug: "skin-sculpt-studio",
    name: "Skin Sculpt Studio",
    location:
      "North Beach Shopping Centre, 1 North Beach Rd, North Beach WA 6020",
    hours: "Mon-Fri 9-6, Sat 8:30-2, Sun closed",
    phone: "0420 393 143",
    paymentNotes: null,
    bookingPlatform: "timely",
    closeType: "link_only",
    confidenceThreshold: 90,
    widgetOrigins: [],
  },
  offers: [
    {
      key: "hifu-399",
      name: "HIFU Accelerator Protocol (Face & Neck Refresh + free pre-peel)",
      priceCents: 39900,
      priceDisplay: "$399",
      rrpDisplay: null,
      bookingUrl:
        "https://bookings.gettimely.com/skinsculptstudio/bb/book?product=5087107%3ASV",
      notes: "single-depth 1.5mm + BioCosmedical pre-peel included",
    },
    {
      key: "hifu-499",
      name: "HIFU Lower Face & Chin, Under Chin Multi-Depth",
      priceCents: 49900,
      priceDisplay: "$499",
      rrpDisplay: null,
      bookingUrl:
        "https://bookings.gettimely.com/skinsculptstudio/bb/book?product=5349961%3ASV",
      notes: "introductory rate on limited spots",
    },
  ],
  entries: [
    // --- Clinic config ---------------------------------------------------------
    {
      entryKey: "skin-sculpt-studio.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Skin Sculpt Studio",
    },
    {
      entryKey: "skin-sculpt-studio.config.location",
      category: "config",
      title: "Location",
      body:
        "North Beach Shopping Centre, 1 North Beach Rd, North Beach WA 6020",
    },
    {
      entryKey: "skin-sculpt-studio.config.hours",
      category: "config",
      title: "Opening hours",
      body: "Mon-Fri 9-6, Sat 8:30-2, Sun closed",
    },
    {
      entryKey: "skin-sculpt-studio.config.phone",
      category: "config",
      title: "Phone",
      body: "0420 393 143",
    },
    {
      entryKey: "skin-sculpt-studio.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Timely - link-only close, Theo does not book manually. Make the link irresistible to click.",
    },

    // --- Offer 1: HIFU Accelerator $399 ----------------------------------------
    {
      entryKey: "skin-sculpt-studio.hifu-399.price",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator price",
      body:
        "HIFU Accelerator Protocol (Face & Neck Refresh + free pre-peel) - $399",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.protocol",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator protocol",
      body:
        "Single-depth (1.5mm) HIFU + BioCosmedical pre-peel included (normally $95 value), 60 min total",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.downtime",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator downtime",
      body: "Zero downtime, mild pinkness 1-3 hrs normal",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.results",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator results",
      body:
        "Results: instant subtle tightness, weeks 2-6 texture/bounce improves, peak 8-12 weeks, lasts 6+ months",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.pain",
      category: "offer",
      offerKey: "hifu-399",
      title: "Does HIFU Accelerator hurt",
      body:
        "Does it hurt: warm tingling, manageable, jawline can feel stronger (energy can be reduced)",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.suitability",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator contraindications",
      body:
        "Not suitable for: active skin infections/open wounds, severe/cystic acne in area, metal implants/pacemakers near area, pregnant/breastfeeding, very severe laxity (surgery more appropriate)",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.upgrade-path",
      category: "offer",
      offerKey: "hifu-399",
      title: "Upgrade path to full lift",
      body:
        "UPGRADE PATH: customers who do this can later upgrade to the full multi-depth face+neck lift (normally $1,499 for one session) at \"Buy 1 Get 1 Half Price\" - a real, relevant upsell if a customer asks about longer-lasting or more dramatic results",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.difference",
      category: "offer",
      offerKey: "hifu-399",
      title: "Difference from full lift",
      body:
        "Difference from full lift: this Refresh is 1.5mm only (surface smoothing/glow); full lift adds 3.0mm+4.5mm (deeper lift, more longevity)",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.combination",
      category: "offer",
      offerKey: "hifu-399",
      title: "Combining with injectables",
      body:
        "Can combine with anti-wrinkle/filler but timing matters - clinician plans at consult",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-399.booking-url",
      category: "booking",
      offerKey: "hifu-399",
      title: "HIFU Accelerator booking link",
      body:
        "https://bookings.gettimely.com/skinsculptstudio/bb/book?product=5087107%3ASV",
    },

    // --- Offer 2: Lower Face & Chin $499 ---------------------------------------
    {
      entryKey: "skin-sculpt-studio.hifu-499.price",
      category: "offer",
      offerKey: "hifu-499",
      title: "Lower face HIFU price",
      body:
        "HIFU Lower Face & Chin, Under Chin Multi-Depth - $499 (introductory rate)",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.device",
      category: "offer",
      offerKey: "hifu-499",
      title: "Lower face HIFU device",
      body:
        "TGA-listed HI-REX device, multi-depth, targets lower cheeks + chin + under chin in one 60 min session",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.downtime",
      category: "offer",
      offerKey: "hifu-499",
      title: "Lower face HIFU downtime",
      body:
        "Zero downtime, mild warmth/light redness for 1-2 hrs is normal",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.results",
      category: "offer",
      offerKey: "hifu-499",
      title: "Lower face HIFU results",
      body:
        "Results: tightness felt immediately, visible lift from ~4 weeks, peak at 10-12 weeks, lasts 12+ months",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.pain",
      category: "offer",
      offerKey: "hifu-499",
      title: "Does lower face HIFU hurt",
      body:
        "Does it hurt: warm pulses and mild prickling, manageable, energy adjusted in real time if uncomfortable",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.suitability",
      category: "offer",
      offerKey: "hifu-499",
      title: "Lower face HIFU contraindications",
      body:
        "Not suitable for: active skin infections, open wounds, severe cystic acne in treatment area, metal implants in the face",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.intro-rate",
      category: "policy",
      offerKey: "hifu-499",
      title: "Lower face introductory rate caveat",
      body:
        "IMPORTANT: $499 is an introductory rate on limited spots - don't imply this is the standard ongoing price if asked about future sessions",
    },
    {
      entryKey: "skin-sculpt-studio.hifu-499.booking-url",
      category: "booking",
      offerKey: "hifu-499",
      title: "Lower face HIFU booking link",
      body:
        "https://bookings.gettimely.com/skinsculptstudio/bb/book?product=5349961%3ASV",
    },

    // --- Policy ----------------------------------------------------------------
    {
      entryKey: "skin-sculpt-studio.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, link-only close",
      body:
        "There is no manual booking step for this clinic. Once the link is sent, Theo has no further control over whether the customer completes the booking - so the reply has to make clicking it as frictionless and appealing as possible. Minimise perceived steps: reference \"takes about a minute\" (matches what the LP itself states). Use genuine urgency already present on the offer pages (limited monthly spots) - don't invent urgency that isn't there. Give the link with a direct instruction, not just a drop: \"Easiest way is to grab your spot here, takes about a minute: {link}\". If the customer has asked multiple questions across the thread, answer them briefly first, then close with the link - don't lead with the link before they've had their question answered, it reads as dismissive.",
    },
    {
      entryKey: "skin-sculpt-studio.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "skin-sculpt-studio.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never negotiates price or discounts beyond what's listed in the offers above. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never implies $499 is the standard ongoing rate for the Lower Face offer. Never trash-talks a named competitor directly in a customer-facing reply. Never guesses which offer a message relates to without checking - asks Theo if unclear.",
    },
    {
      entryKey: "skin-sculpt-studio.policy.competitor-framing",
      category: "policy",
      title: "Competitor objection handling",
      body:
        "If the customer names a specific competitor, do not trash-talk them by name or repeat the landing page's \"budget HIFU\" comparison language directly at a competitor - keep it positive and focused on what Skin Sculpt Studio delivers, not what others lack.",
    },
    {
      entryKey: "skin-sculpt-studio.policy.unmatched-offer",
      category: "policy",
      title: "Enquiry does not match either offer",
      body:
        "KNOWN GAP: if a customer's enquiry doesn't clearly match one of these two offers, or references a price/treatment that doesn't match either, don't guess - ask Theo which campaign this is before drafting.",
    },
  ],
  sourceAssertions: [
    "$399",
    "$499",
    "$1,499",
    "$95 value",
    "0420 393 143",
    "bookings.gettimely.com/skinsculptstudio",
    "North Beach Shopping Centre",
    "BioCosmedical pre-peel",
    "HI-REX device",
  ],
  importGaps: ["do_not_answer_list", "compliance_block", "widget_origins"],
  importNotes: [
    "Two Timely offers; link-only close with no manual booking step.",
  ],
};
