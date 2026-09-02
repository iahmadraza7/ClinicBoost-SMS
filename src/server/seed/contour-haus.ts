import type { ClinicSeedPack } from "./types";

/**
 * Contour Haus Skin and Body, transcribed from
 * knowledge-source/converted/contour-haus.md. Every body is lifted from that
 * file; nothing invented.
 */
export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/contour-haus.md",
  clinic: {
    slug: "contour-haus",
    name: "Contour Haus Skin and Body",
    location: "156 Rockingham Rd, Hamilton Hill WA 6163",
    hours: "Mon-Sat 10-6, Sun closed",
    phone: "0475 740 220",
    paymentNotes: null,
    bookingPlatform: "wix",
    closeType: "link_only",
    confidenceThreshold: 90,
    widgetOrigins: ["https://www.contourhausskinandbody.com.au"],
  },
  offers: [
    {
      key: "hifu-full-face-299",
      name: "HIFU Full Face Multi-Depth",
      priceCents: 29900,
      priceDisplay: "$299",
      rrpDisplay: null,
      bookingUrl:
        "https://www.contourhausskinandbody.com.au/booking-calendar/hifu-full-face-multi-depth-just-299",
      notes: null,
    },
    {
      key: "hifu-fat-99",
      name: "HIFU Fat-Reduction",
      priceCents: 9900,
      priceDisplay: "$99/area",
      rrpDisplay: "$349/area",
      bookingUrl:
        "https://www.contourhausskinandbody.com.au/booking-calendar/hifu-fat-melting-promo-just-99?timezone=Australia%2FPerth&referral=service_details_widget",
      notes: "intro price, normally $349/area",
    },
  ],
  entries: [
    {
      entryKey: "contour-haus.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Contour Haus Skin and Body",
    },
    {
      entryKey: "contour-haus.config.location",
      category: "config",
      title: "Location",
      body: "156 Rockingham Rd, Hamilton Hill WA 6163",
    },
    {
      entryKey: "contour-haus.config.hours",
      category: "config",
      title: "Opening hours",
      body: "Mon-Sat 10-6, Sun closed",
    },
    {
      entryKey: "contour-haus.config.phone",
      category: "config",
      title: "Phone",
      body: "0475 740 220",
    },
    {
      entryKey: "contour-haus.config.therapist",
      category: "config",
      title: "Therapist",
      body:
        "Carina D. - Founder & Lead Skin Therapist, 18-20+ years in the beauty industry",
    },
    {
      entryKey: "contour-haus.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Wix native booking calendar - functions like Timely/Cliniko. Customer books and confirms their own slot instantly, no manual approval from the clinic. Link-only close, Theo does not book manually.",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.price",
      category: "offer",
      offerKey: "hifu-full-face-299",
      title: "HIFU full face price",
      body: "HIFU Full Face Multi-Depth — $299",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.protocol",
      category: "offer",
      offerKey: "hifu-full-face-299",
      title: "HIFU full face protocol",
      body:
        "Full multi-depth protocol (1.5mm + 3mm + 4.5mm layers), 60 min appointment, one visit, 16D HIFU device",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.downtime",
      category: "offer",
      offerKey: "hifu-full-face-299",
      title: "HIFU full face downtime",
      body:
        "Zero downtime, mild pinkness 1-3 hrs normal, back to normal life same day",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.results",
      category: "offer",
      offerKey: "hifu-full-face-299",
      title: "HIFU full face results",
      body:
        "Results: instant subtle tightness, weeks 2-6 texture/bounce improves, peak 8-12 weeks, lasts 6+ months",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.pain",
      category: "faq",
      offerKey: "hifu-full-face-299",
      title: "Does HIFU full face hurt",
      body:
        "Does it hurt: warm tingling, manageable for most, jawline can feel stronger (energy can be reduced)",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.contraindications",
      category: "faq",
      offerKey: "hifu-full-face-299",
      title: "HIFU full face contraindications",
      body:
        "Not suitable for: active skin infections/open wounds, severe/cystic acne in area, metal implants/pacemakers near area, pregnant/breastfeeding, very severe laxity (surgery more appropriate)",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.combine",
      category: "faq",
      offerKey: "hifu-full-face-299",
      title: "Combining HIFU with other treatments",
      body:
        "Can combine with anti-wrinkle/filler but timing matters - clinician plans sequence at consult",
    },
    {
      entryKey: "contour-haus.hifu-full-face-299.booking-url",
      category: "booking",
      offerKey: "hifu-full-face-299",
      title: "HIFU full face booking link",
      body:
        "https://www.contourhausskinandbody.com.au/booking-calendar/hifu-full-face-multi-depth-just-299",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.price",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction price",
      body: "HIFU Fat-Reduction — $99/area (intro price, normally $349/area)",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.protocol",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction protocol",
      body:
        "16D HIFU system, targets fat at 6-13mm depth, therapist-performed, 15x15cm treatment zone per session",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.downtime",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction downtime",
      body:
        "Zero downtime, no bruising/freezing/suction pain - warm sensation only",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.results",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction results",
      body:
        "Results: visible from week 4, body keeps clearing fat over 8-12 weeks, 1-3 sessions typically enough",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.permanence",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction permanence",
      body: "Permanent fat cell destruction (cells don't regrow)",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.intro-rate",
      category: "policy",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction intro rate caveat",
      body:
        "IMPORTANT: $99 is an intro/first-session rate, not the standard price - if a customer asks about repeat sessions or additional areas beyond the intro offer, be upfront that pricing may differ, don't assume $99 applies indefinitely",
    },
    {
      entryKey: "contour-haus.hifu-fat-99.booking-url",
      category: "booking",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction booking link",
      body:
        "https://www.contourhausskinandbody.com.au/booking-calendar/hifu-fat-melting-promo-just-99?timezone=Australia%2FPerth&referral=service_details_widget",
    },
    {
      entryKey: "contour-haus.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, link-only close",
      body:
        "Booking is self-serve and instantly confirmed the moment the customer picks a slot - there is no manual step for Theo, so the reply has to make clicking the link as frictionless and appealing as possible. Minimise perceived steps: reference \"takes about a minute\" (matches what the LP itself states). Use genuine urgency already present on the offer pages (limited monthly spots) - don't invent urgency that isn't there. Give the link with a direct instruction, not just a drop: \"Easiest way is to grab your spot here, takes about a minute: {link}\". If the customer has asked multiple questions across the thread, answer them briefly first, then close with the link - don't lead with the link before their question is answered, it reads as dismissive.",
    },
    {
      entryKey: "contour-haus.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "contour-haus.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never drafts as if it's sending automatically - every output is for Theo to review. Never negotiates price or discounts beyond what's listed in the offers above. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never implies an intro price ($99) is the standard ongoing rate. Never guesses which offer a message relates to without checking - asks Theo if unclear.",
    },
    {
      entryKey: "contour-haus.policy.outside-scope",
      category: "policy",
      title: "Outside scope enquiries",
      body:
        "Outside scope (medical suitability beyond what's listed above, refund/complaint, price negotiation, anything angry or upset): draft a holding reply that doesn't overcommit, and flag clearly at the top: \"FLAG: outside scope - review before sending.\" Do not attempt to resolve complaints or negotiate price. Do not answer medical questions not covered in the offer info above - suggest they raise it at consult or call the clinic directly (0475 740 220).",
    },
    {
      entryKey: "contour-haus.policy.unmatched-offer",
      category: "policy",
      title: "Enquiry does not match either offer",
      body:
        "KNOWN GAP: if a customer's enquiry doesn't clearly match one of these two offers, or references a price/treatment that doesn't match either, don't guess - ask Theo which campaign this is before drafting.",
    },
    {
      entryKey: "contour-haus.policy.hesitant-objection",
      category: "policy",
      title: "Hesitant or objection messages",
      body:
        "Hesitant / objection (\"thinking about it\", \"is it worth it\", \"does it actually work\"): brief reassurance using proof points already in the offer info (18-20+ years experience, thousands of treatments, 4.9-5.0 rating, 16D device exclusivity). Don't argue. One line of value, then invite the booking.",
    },
  ],
  sourceAssertions: [
    "$299",
    "$99/area",
    "$349/area",
    "https://www.contourhausskinandbody.com.au/booking-calendar/hifu-full-face-multi-depth-just-299",
    "https://www.contourhausskinandbody.com.au/booking-calendar/hifu-fat-melting-promo-just-99",
    "0475 740 220",
    "16D HIFU device",
  ],
  importGaps: ["do_not_answer_list", "compliance_block"],
  importNotes: [],
};
