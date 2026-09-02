import type { ClinicSeedPack } from "./types";

/**
 * Three Sisters Beauty, transcribed from
 * knowledge-source/converted/three-sisters-beauty.md.
 *
 * Every `body` below is text lifted from that file. Nothing here is invented.
 */

export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/three-sisters-beauty.md",
  clinic: {
    slug: "three-sisters-beauty",
    name: "Three Sisters Beauty - Yagoona",
    location: "440 Hume Hwy, Yagoona NSW 2199",
    hours: "Mon-Sat 10am-7pm, Sun closed",
    phone: "0416 830 639",
    paymentNotes: null,
    bookingPlatform: "fresha",
    closeType: "link_only",
    confidenceThreshold: 90,
    widgetOrigins: [],
  },
  offers: [
    {
      key: "hifu-399",
      name: "HIFU Accelerator Protocol",
      priceCents: 39900,
      priceDisplay: "$399",
      rrpDisplay: null,
      bookingUrl: "https://offers.threesistersbeauty.com.au/hifu399",
      notes: "single session, full face and neck refresh",
    },
    {
      key: "upgrade-799",
      name: "Full Multi-Depth Lift Upgrade",
      priceCents: 79900,
      priceDisplay: "$799",
      rrpDisplay: "$1,299",
      bookingUrl: "https://offers.threesistersbeauty.com.au/hifu399",
      notes: "$399 already paid credited; extra $400 to upgrade",
    },
  ],
  entries: [
    // --- Clinic config ---------------------------------------------------------
    {
      entryKey: "three-sisters-beauty.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Three Sisters Beauty - Yagoona",
    },
    {
      entryKey: "three-sisters-beauty.config.location",
      category: "config",
      title: "Location",
      body: "440 Hume Hwy, Yagoona NSW 2199",
    },
    {
      entryKey: "three-sisters-beauty.config.hours",
      category: "config",
      title: "Opening hours",
      body: "Mon-Sat 10am-7pm, Sun closed",
    },
    {
      entryKey: "three-sisters-beauty.config.phone",
      category: "config",
      title: "Phone",
      body: "0416 830 639",
    },
    {
      entryKey: "three-sisters-beauty.config.therapists",
      category: "config",
      title: "Therapists",
      body:
        "Kimberly - Owner/Operator, Advanced Skin Therapist, 6 years experience, HIFU/Fat-Freezing & Laser expertise. Also on team: Hana - Senior Esthetician, Qualified in Beauty Therapy, 7 years experience, Technology specialist in HIFU/RF/Laser.",
    },
    {
      entryKey: "three-sisters-beauty.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Fresha, self-serve instant confirm. Customer books and confirms their own slot instantly, no manual approval from the clinic. Link-only close, Theo does not book manually.",
    },

    // --- Offer 1: HIFU Accelerator $399 ----------------------------------------
    {
      entryKey: "three-sisters-beauty.hifu-399.price",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator price",
      body: "HIFU Accelerator Protocol - $399",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.protocol",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator protocol",
      body:
        "Cleanse, exfoliate & extraction facial (Synergy Skin Care) + HIFU full face & neck refresh, ~60 min total, one visit",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.step1",
      category: "offer",
      offerKey: "hifu-399",
      title: "Step 1 prep facial",
      body:
        "Step 1: 15-min consult + cleanse/exfoliate/manual extraction facial (Synergy Skin Care) to prep skin for ultrasound penetration (37% better results per the clinic's own claim)",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.step2",
      category: "offer",
      offerKey: "hifu-399",
      title: "Step 2 HIFU treatment",
      body:
        "Step 2: 30-40 min HIFU full face & neck, 1.5mm depth, TGA-listed device (ARTG 473085)",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.finish",
      category: "offer",
      offerKey: "hifu-399",
      title: "Treatment finish",
      body: "Finished with a calming sheet mask",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.downtime",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator downtime",
      body:
        "Zero downtime, back to work same day. Mild pinkness 1-3 hrs normal, light \"held\" feeling is a good sign",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.pain",
      category: "offer",
      offerKey: "hifu-399",
      title: "Does HIFU Accelerator hurt",
      body:
        "Does it hurt: warm tingling/brief zaps, manageable for most, jawline can feel stronger near bone (energy can be reduced or paused)",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.results",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator results",
      body:
        "Results: Week 1 instant tightness, weeks 2-4 smoother texture/bouncier feel, weeks 4-12 peak glow and firmness (collagen rebuild peaks ~4-6 weeks)",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.suitability",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU Accelerator contraindications",
      body:
        "Not suitable for: active skin infections/open wounds, severe/cystic acne in treatment area, metal implants/pacemakers in or near area, pregnant/breastfeeding, very severe laxity where surgery is more appropriate. Clinic assesses carefully at consult and will recommend a different path if HIFU isn't right for them.",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.combination",
      category: "offer",
      offerKey: "hifu-399",
      title: "Combining with injectables",
      body:
        "Can combine with anti-wrinkle/fillers, but leave about 4 weeks between treatments",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.sessions",
      category: "offer",
      offerKey: "hifu-399",
      title: "Session count",
      body: "Single session offer, no implied course of multiple sessions",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.proof",
      category: "offer",
      offerKey: "hifu-399",
      title: "Proof points",
      body: "Proof points: 4.9 stars, 500+ happy clients",
    },
    {
      entryKey: "three-sisters-beauty.hifu-399.booking-url",
      category: "booking",
      offerKey: "hifu-399",
      title: "HIFU Accelerator booking link",
      body: "https://offers.threesistersbeauty.com.au/hifu399",
    },

    // --- Offer 2: Multi-depth upgrade $799 ------------------------------------
    {
      entryKey: "three-sisters-beauty.upgrade-799.price",
      category: "offer",
      offerKey: "upgrade-799",
      title: "Multi-depth upgrade price",
      body: "Upgrade - Full Multi-Depth Lift - $799 total (RRP $1,299)",
    },
    {
      entryKey: "three-sisters-beauty.upgrade-799.mechanics",
      category: "offer",
      offerKey: "upgrade-799",
      title: "Upgrade mechanics",
      body:
        "Confirmed by Theo. This is an upgrade path from the $399 Accelerator Protocol, not a separate standalone offer - the landing page states the $399 already paid is credited toward the upgrade. The $399 already paid gets credited if the customer upgrades, so the extra to pay is $400 on top, taking the total to $799",
    },
    {
      entryKey: "three-sisters-beauty.upgrade-799.when-to-offer",
      category: "policy",
      offerKey: "upgrade-799",
      title: "When to mention the upgrade",
      body:
        "This is only ever offered as a next step after a customer has already asked about it or already done the Accelerator Protocol - don't proactively push this upgrade in a cold first-contact reply, only address it if the customer brings it up (the landing page itself only raises it in a FAQ, not the main pitch)",
    },
    {
      entryKey: "three-sisters-beauty.upgrade-799.depth-detail",
      category: "policy",
      offerKey: "upgrade-799",
      title: "Multi-depth detail gap",
      body:
        "No further mechanism/depth detail confirmed beyond what the landing page FAQ implies (multi-depth vs the single 1.5mm layer in the base offer) - if a customer asks what's physically different about the multi-depth treatment beyond price, don't invent detail, tell them Theo/the clinic will cover that at consult",
    },
    {
      entryKey: "three-sisters-beauty.upgrade-799.booking-url",
      category: "booking",
      offerKey: "upgrade-799",
      title: "Upgrade booking link",
      body: "https://offers.threesistersbeauty.com.au/hifu399",
    },

    // --- Policy ----------------------------------------------------------------
    {
      entryKey: "three-sisters-beauty.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, link-only close",
      body:
        "Booking is self-serve and instantly confirmed the moment the customer picks a slot - there is no manual step for Theo, so the reply has to make clicking the link as frictionless and appealing as possible. Minimise perceived steps: reference \"takes about 45 seconds\" (matches what the LP itself states). Use genuine urgency already present on the offer page (limited monthly spots) - don't invent urgency that isn't there. Give the link with a direct instruction, not just a drop: \"Easiest way is to grab your spot here, takes under a minute: {link}\". If the customer has asked multiple questions across the thread, answer them briefly first, then close with the link - don't lead with the link before their question is answered, it reads as dismissive.",
    },
    {
      entryKey: "three-sisters-beauty.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "three-sisters-beauty.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never negotiates price or discounts beyond what's listed in the offer above. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never implies more than one session is included or expected. Never guesses which offer a message relates to without checking - asks Theo if unclear.",
    },
    {
      entryKey: "three-sisters-beauty.policy.unmatched-offer",
      category: "policy",
      title: "Enquiry does not match either offer",
      body:
        "KNOWN GAP: if a customer's enquiry doesn't clearly match one of the two offers above, or references a price/treatment that doesn't match either, don't guess - ask Theo which campaign this is before drafting.",
    },
  ],
  sourceAssertions: [
    "$399",
    "$799",
    "$1,299",
    "$400",
    "0416 830 639",
    "440 Hume Hwy, Yagoona NSW 2199",
    "offers.threesistersbeauty.com.au/hifu399",
    "ARTG 473085",
    "4.9 stars",
  ],
  importGaps: ["do_not_answer_list", "compliance_block", "widget_origins"],
  importNotes: [
    "Fresha self-serve instant confirm; link-only close.",
    "Multi-depth upgrade is a second offer, not proactively pushed on first contact.",
  ],
};
