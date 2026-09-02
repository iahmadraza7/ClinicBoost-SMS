import type { ClinicSeedPack } from "./types";

/**
 * Defined Cosmetics, transcribed from
 * knowledge-source/converted/defined-cosmetics.md. Every body is lifted from
 * that file; nothing invented.
 */
export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/defined-cosmetics.md",
  clinic: {
    slug: "defined-cosmetics",
    name: "Defined Cosmetics",
    location: "Studio 8/233 Turpin Road, Labrador, Gold Coast QLD 4215",
    hours: "Mon 9-6, Tue 9-6, Wed 9-8, Thu 9-8, Fri 9-5, Sat 9-3, Sun closed",
    phone: "0423 965 770",
    paymentNotes: null,
    bookingPlatform: "fresha",
    closeType: "manual",
    confidenceThreshold: 90,
    widgetOrigins: ["https://www.fresha.com"],
  },
  offers: [
    {
      key: "hifu-399",
      name: "HIFU Face & Neck Multi-Depth + free Ultraderm take-home kit",
      priceCents: 39900,
      priceDisplay: "$399",
      rrpDisplay: null,
      bookingUrl:
        "https://www.fresha.com/book-now/defined-lashes-brows-x8vvmguf/services?lid=1519505&eid=3417732&oiid=sv%3A28308437&share=true&pId=1443129",
      notes: "new client price",
    },
  ],
  entries: [
    {
      entryKey: "defined-cosmetics.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Defined Cosmetics",
    },
    {
      entryKey: "defined-cosmetics.config.location",
      category: "config",
      title: "Location",
      body: "Studio 8/233 Turpin Road, Labrador, Gold Coast QLD 4215",
    },
    {
      entryKey: "defined-cosmetics.config.hours",
      category: "config",
      title: "Opening hours",
      body: "Mon 9-6, Tue 9-6, Wed 9-8, Thu 9-8, Fri 9-5, Sat 9-3, Sun closed",
    },
    {
      entryKey: "defined-cosmetics.config.phone",
      category: "config",
      title: "Phone",
      body: "0423 965 770",
    },
    {
      entryKey: "defined-cosmetics.config.therapist",
      category: "config",
      title: "Therapist",
      body: "Tayla - Founder & Skin Specialist, in the beauty industry since 2018",
    },
    {
      entryKey: "defined-cosmetics.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Fresha - Theo books manually once a day/time is confirmed in the thread",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.price",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU face and neck price",
      body:
        "HIFU Face & Neck Multi-Depth + free Ultraderm take-home kit — $399 (new client price)",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.device",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU device and protocol",
      body:
        "Genuine multi-depth, multi-cartridge HIFU (ApoloMed system) - treats face + neck together in one visit, not a single-pass/single-depth version. TGA-listed device",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.inclusions",
      category: "offer",
      offerKey: "hifu-399",
      title: "What is included",
      body:
        "Includes: face + neck HIFU treatment, Ultraderm take-home kit (cleanser, SPF moisturiser, tri-peptide moisturiser), skin goals consultation, suitability check, aftercare guidance - all bundled into the $399, kit is not an upsell",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.pain",
      category: "faq",
      offerKey: "hifu-399",
      title: "Does HIFU hurt",
      body:
        "Does it hurt: warmth or tingling sensation, comfort varies person to person, generally well tolerated per reviews",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.downtime",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU downtime",
      body: "Downtime: little to none for most, mild redness/tenderness possible",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.results",
      category: "offer",
      offerKey: "hifu-399",
      title: "HIFU results timeline",
      body:
        "Results: some notice initial refreshed look, full results develop gradually over weeks to months - not instant, not a substitute for surgery or facelift",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.contraindications",
      category: "faq",
      offerKey: "hifu-399",
      title: "HIFU contraindications",
      body:
        "NOT suitable for: pregnancy or breastfeeding, pacemakers, metal or electronic implants, active skin infection in treatment area. Suitability always confirmed at appointment - team will say upfront if it's not right for the customer",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.capacity",
      category: "offer",
      offerKey: "hifu-399",
      title: "Appointment availability",
      body:
        "New-client price, limited appointments released weekly due to clinic capacity",
    },
    {
      entryKey: "defined-cosmetics.hifu-399.booking-url",
      category: "booking",
      offerKey: "hifu-399",
      title: "HIFU booking link",
      body:
        "https://www.fresha.com/book-now/defined-lashes-brows-x8vvmguf/services?lid=1519505&eid=3417732&oiid=sv%3A28308437&share=true&pId=1443129",
    },
    {
      entryKey: "defined-cosmetics.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, manual close",
      body:
        "Theo books manually once a day/time is confirmed in the thread. Ask a direct scheduling question, don't just send the link and hope. Example shape: \"We've got a spot Wed or Thurs evening this week, or Sat morning, what suits you?\" Get a real answer (day + rough time). Once they confirm, let them know you'll lock it in - Theo takes it from there.",
    },
    {
      entryKey: "defined-cosmetics.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "defined-cosmetics.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never drafts as if it's sending automatically - every output is for Theo to review. Never negotiates price or discounts beyond what's listed in the offer above. Never implies the take-home kit is optional or extra - it's included. Never claims HIFU results are instant or equivalent to a facelift/surgery. Never answers medical/suitability questions beyond the listed contraindications - flags anything murkier. Never handles refund or complaint messages beyond a holding reply + flag.",
    },
    {
      entryKey: "defined-cosmetics.policy.outside-scope",
      category: "policy",
      title: "Outside scope enquiries",
      body:
        "Outside scope (medical suitability beyond the contraindications listed above, refund/complaint, price negotiation, anything angry or upset, or borderline suitability questions - e.g. specific medications, skin conditions not explicitly named): draft a holding reply that doesn't overcommit, and flag clearly at the top: \"FLAG: outside scope - review before sending.\" Do not attempt to resolve complaints or negotiate price. If the message clearly matches a listed contraindication (pregnancy, pacemaker/implants, active skin infection), it's fine to say gently that this may affect suitability and the team will confirm at consult - don't just say \"flag\" for something already answered on the page. For anything murkier, suggest they raise it at consult or call Tayla directly (0423 965 770).",
    },
    {
      entryKey: "defined-cosmetics.policy.hesitant-objection",
      category: "policy",
      title: "Hesitant or objection messages",
      body:
        "Hesitant / objection (\"thinking about it\", \"is it worth it\", \"does it actually work\", \"why so cheap\"): brief reassurance using proof points already in the offer info (5.0 rating, 937+ verified Fresha reviews, first multi-liner HIFU clinic in QLD, TGA-listed tech, honest suitability promise). One line of value, then invite the booking.",
    },
  ],
  sourceAssertions: [
    "$399",
    "https://www.fresha.com/book-now/defined-lashes-brows-x8vvmguf/services",
    "0423 965 770",
    "ApoloMed system",
    "Ultraderm take-home kit",
  ],
  importGaps: ["do_not_answer_list", "compliance_block"],
  importNotes: [],
};
