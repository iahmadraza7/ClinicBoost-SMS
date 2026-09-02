import type { ClinicSeedPack } from "./types";

/**
 * Ricky's Aesthetics, transcribed from
 * knowledge-source/converted/rickys-aesthetics.md.
 *
 * Every `body` below is text lifted from that file. Nothing here is invented.
 */

export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/rickys-aesthetics.md",
  clinic: {
    slug: "rickys-aesthetics",
    name: "Ricky's Aesthetics",
    location: "6 Byth St, Banyo QLD 4014 (Brisbane)",
    hours: "Mon-Sat 9:30am-7pm, Sun closed",
    phone: "0423 017 876",
    paymentNotes: null,
    bookingPlatform: "fresha",
    closeType: "manual",
    confidenceThreshold: 90,
    widgetOrigins: [],
  },
  offers: [
    {
      key: "hifu-299",
      name: "HIFU Full Face Multi-Depth Pro-Lift",
      priceCents: 29900,
      priceDisplay: "$299",
      rrpDisplay: null,
      bookingUrl:
        "https://www.fresha.com/book-now/rickys-aesthetics-b8eyld8v/services?lid=903816&eid=2260480&oiid=sv%3A27578581&share=true&pId=850680",
      notes: "face only, 16D HIFU device",
    },
  ],
  entries: [
    // --- Clinic config ---------------------------------------------------------
    {
      entryKey: "rickys-aesthetics.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Ricky's Aesthetics",
    },
    {
      entryKey: "rickys-aesthetics.config.location",
      category: "config",
      title: "Location",
      body: "6 Byth St, Banyo QLD 4014 (Brisbane)",
    },
    {
      entryKey: "rickys-aesthetics.config.hours",
      category: "config",
      title: "Opening hours",
      body: "Mon-Sat 9:30am-7pm, Sun closed",
    },
    {
      entryKey: "rickys-aesthetics.config.phone",
      category: "config",
      title: "Phone",
      body: "0423 017 876",
    },
    {
      entryKey: "rickys-aesthetics.config.therapist",
      category: "config",
      title: "Therapist",
      body:
        "Ricky S. - Founder & Lead Skin Therapist, former science teacher",
    },
    {
      entryKey: "rickys-aesthetics.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Fresha - Theo books manually once a day/time is confirmed in the thread",
    },

    // --- Offer: HIFU Full Face $299 --------------------------------------------
    {
      entryKey: "rickys-aesthetics.hifu-299.price",
      category: "offer",
      offerKey: "hifu-299",
      title: "HIFU price",
      body: "HIFU Full Face Multi-Depth Pro-Lift - $299",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.protocol",
      category: "offer",
      offerKey: "hifu-299",
      title: "HIFU protocol",
      body:
        "Full multi-depth protocol (1.5mm + 3mm + 4.5mm layers), 60 min appointment total (45 min treatment), one visit, 16D HIFU device",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.scope",
      category: "offer",
      offerKey: "hifu-299",
      title: "Treatment scope (face only)",
      body:
        "FACE ONLY - do not tell customers neck is included. The landing page header and offer name both say \"Full Face,\" and this matches what Theo confirmed. Note: one line of the page's own body copy says \"full face and neck are treated in one visit,\" which contradicts the headline - this is a likely landing page error, flagged to Theo for fixing. Until confirmed otherwise, treat this as face-only and do not promise neck coverage.",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.downtime",
      category: "offer",
      offerKey: "hifu-299",
      title: "HIFU downtime",
      body:
        "Zero downtime, mild pinkness 1-3 hrs normal, back to normal life same day",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.results",
      category: "offer",
      offerKey: "hifu-299",
      title: "HIFU results timeline",
      body:
        "Results: instant subtle tightness, weeks 2-6 texture/bounce improves, peak 8-12 weeks, lasts 6+ months",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.pain",
      category: "offer",
      offerKey: "hifu-299",
      title: "Does HIFU hurt",
      body:
        "Does it hurt: warm tingling, manageable for most, jawline can feel stronger (energy can be reduced)",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.suitability-listed",
      category: "offer",
      offerKey: "hifu-299",
      title: "Listed contraindications",
      body:
        "Not suitable for: active skin infections/open wounds, severe/cystic acne in area, metal implants/pacemakers near area, pregnant/breastfeeding, very severe laxity (surgery more appropriate)",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.combination",
      category: "offer",
      offerKey: "hifu-299",
      title: "Combining with injectables",
      body:
        "Can combine with anti-wrinkle/filler but timing matters - clinician plans sequence at consult",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.booking-url",
      category: "booking",
      offerKey: "hifu-299",
      title: "HIFU booking link",
      body:
        "https://www.fresha.com/book-now/rickys-aesthetics-b8eyld8v/services?lid=903816&eid=2260480&oiid=sv%3A27578581&share=true&pId=850680",
    },
    {
      entryKey: "rickys-aesthetics.hifu-299.neck-inclusion",
      category: "faq",
      offerKey: "hifu-299",
      title: "Whether neck is included",
      body:
        "Whether neck is included - unresolved discrepancy: the offer name and headline say \"Full Face,\" but one line of body copy claims neck is also treated in the same visit. Until confirmed otherwise, treat this as face-only and flag any direct neck question rather than guessing.",
      answerMode: "blocked",
      blockDeflect:
        "Full face is definitely included. For neck coverage, best to check with the team when you book so they can confirm for your visit.",
      triggerTerms: [
        "neck included",
        "include neck",
        "includes neck",
        "is neck",
        "does neck",
        "face and neck",
        "full face and neck",
        "neck as well",
        "neck too",
        "treat the neck",
        "neck coverage",
      ],
    },

    // --- Policy ----------------------------------------------------------------
    {
      entryKey: "rickys-aesthetics.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, manual close",
      body:
        "Theo books manually once a day/time is confirmed in the thread. Ask a direct scheduling question, don't just send the link and hope. Example shape: \"We've got a spot Tues or Thurs arvo this week, or Sat morning, what suits you?\" Get a real answer (day + rough time). Once they confirm, let them know you'll lock it in - Theo takes it from there.",
    },
    {
      entryKey: "rickys-aesthetics.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "rickys-aesthetics.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never negotiates price or discounts beyond what's listed in the offer above. Never confidently confirms or denies neck inclusion until the landing page discrepancy is resolved. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag.",
    },
  ],
  sourceAssertions: [
    "$299",
    "0423 017 876",
    "6 Byth St, Banyo QLD 4014",
    "Mon-Sat 9:30am-7pm",
    "HIFU Full Face Multi-Depth Pro-Lift",
    "fresha.com/book-now/rickys-aesthetics",
    "16D HIFU device",
  ],
  importGaps: ["do_not_answer_list", "compliance_block", "widget_origins"],
  importNotes: [
    "Landing page has internal inconsistency on neck inclusion; seeded as blocked FAQ until Ricky confirms.",
  ],
};
