import type { ClinicSeedPack } from "./types";

/**
 * Love Your Skin, transcribed from knowledge-source/converted/love-your-skin.md.
 * Every body is lifted from that file; nothing invented.
 */
export const PACK: ClinicSeedPack = {
  sourceFile: "knowledge-source/converted/love-your-skin.md",
  clinic: {
    slug: "love-your-skin",
    name: "Love Your Skin (by DK)",
    location:
      "Caroline Springs: 5 Dobell Cres, Caroline Springs VIC 3023. Moonee Ponds: Suite 11/33 Homer Street, Moonee Ponds VIC 3039.",
    hours:
      "Caroline Springs: Mon 10-5, Tue 10-6, Wed-Thu 10-8, Fri 10-7, Sat 10-8, Sun closed. Moonee Ponds: Mon-Sun 10-6.",
    phone: "0420 307 584",
    paymentNotes: null,
    bookingPlatform: "fresha",
    closeType: "manual",
    confidenceThreshold: 90,
    widgetOrigins: ["https://www.fresha.com"],
  },
  offers: [
    {
      key: "hifu-face-neck-289",
      name: "HIFU Full Face & Neck Lift",
      priceCents: 28900,
      priceDisplay: "$289",
      rrpDisplay: null,
      bookingUrl:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?oiid=sv%3A25081016&share=true&pId=849842",
      notes: null,
    },
    {
      key: "hifu-fat-99",
      name: "HIFU Fat-Reduction",
      priceCents: 9900,
      priceDisplay: "$99/area",
      rrpDisplay: "$299/area",
      bookingUrl:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?oiid=sv%3A24633607&share=true&pId=849842",
      notes: "intro price, normally $299/area",
    },
    {
      key: "fat-freeze-138",
      name: "Fat-Freezing (Cryolipolysis)",
      priceCents: 13800,
      priceDisplay: "$138/area",
      rrpDisplay: "$300+",
      bookingUrl:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?oiid=sv%3A24411275&share=true&pId=849842",
      notes: "intro rate, normally $300+, limited spots",
    },
    {
      key: "lymphatic-149",
      name: "Full Body Lymphatic Drainage",
      priceCents: 14900,
      priceDisplay: "$149",
      rrpDisplay: null,
      bookingUrl:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?lid=902929&eid=3492257&oiid=sv%3A27121200&share=true&pId=849842",
      notes: "Caroline Springs only",
    },
  ],
  entries: [
    {
      entryKey: "love-your-skin.config.clinic-name",
      category: "config",
      title: "Clinic name",
      body: "Love Your Skin (by DK)",
    },
    {
      entryKey: "love-your-skin.config.locations",
      category: "config",
      title: "Locations",
      body:
        "Caroline Springs: 5 Dobell Cres, Caroline Springs VIC 3023. Hours: Mon 10-5, Tue 10-6, Wed-Thu 10-8, Fri 10-7, Sat 10-8, Sun closed. Moonee Ponds: Suite 11/33 Homer Street, Moonee Ponds VIC 3039. Hours: Mon-Sun 10-6.",
    },
    {
      entryKey: "love-your-skin.config.phone",
      category: "config",
      title: "Phone",
      body: "0420 307 584",
    },
    {
      entryKey: "love-your-skin.config.booking-platform",
      category: "booking",
      title: "Booking platform",
      body:
        "Fresha - Theo books manually once a day/time is confirmed in the thread",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.price",
      category: "offer",
      offerKey: "hifu-face-neck-289",
      title: "HIFU face and neck price",
      body: "HIFU Full Face & Neck Lift — $289",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.protocol",
      category: "offer",
      offerKey: "hifu-face-neck-289",
      title: "HIFU face and neck protocol",
      body:
        "Full multi-depth protocol (1.5mm + 3mm + 4.5mm layers), 60 min session, one visit",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.downtime",
      category: "offer",
      offerKey: "hifu-face-neck-289",
      title: "HIFU downtime",
      body:
        "Zero downtime, mild pinkness 1-3 hrs normal, back to normal life same day",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.results",
      category: "offer",
      offerKey: "hifu-face-neck-289",
      title: "HIFU results",
      body:
        "Results: instant subtle tightness, weeks 2-6 texture/bounce improves, peak at 8-12 weeks, lasts 6+ months",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.pain",
      category: "faq",
      offerKey: "hifu-face-neck-289",
      title: "Does HIFU hurt",
      body:
        "Does it hurt: warm tingling, manageable for most, jawline can feel stronger (can reduce energy)",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.contraindications",
      category: "faq",
      offerKey: "hifu-face-neck-289",
      title: "HIFU contraindications",
      body:
        "Not suitable for: active skin infections/open wounds, severe/cystic acne in area, metal implants/pacemakers near area, pregnant/breastfeeding, very severe laxity (surgery more appropriate)",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.combine",
      category: "faq",
      offerKey: "hifu-face-neck-289",
      title: "Combining HIFU with other treatments",
      body:
        "Can combine with anti-wrinkle/filler but timing matters - clinician plans sequence at consult",
    },
    {
      entryKey: "love-your-skin.hifu-face-neck-289.booking-url",
      category: "booking",
      offerKey: "hifu-face-neck-289",
      title: "HIFU face and neck booking link",
      body:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?oiid=sv%3A25081016&share=true&pId=849842",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.price",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction price",
      body: "HIFU Fat-Reduction — $99/area (intro price, normally $299/area)",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.protocol",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction protocol",
      body:
        "High-strength HIFU targeting fat at 6-13mm depth, therapist-performed",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.downtime",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction downtime",
      body:
        "Zero downtime, no bruising/freezing/suction pain - warm sensation only",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.results",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction results",
      body:
        "Results: visible from week 4, body keeps clearing fat over 8-12 weeks, 1-3 sessions typically enough",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.permanence",
      category: "offer",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction permanence",
      body: "Permanent fat cell destruction (cells don't regrow)",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.intro-rate",
      category: "policy",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction intro rate caveat",
      body:
        "IMPORTANT: $99 is an intro/first-session rate, not the standard price - if a customer asks about repeat sessions or additional areas beyond the intro offer, be upfront that pricing may differ, don't assume $99 applies indefinitely",
    },
    {
      entryKey: "love-your-skin.hifu-fat-99.booking-url",
      category: "booking",
      offerKey: "hifu-fat-99",
      title: "HIFU fat-reduction booking link",
      body:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?oiid=sv%3A24633607&share=true&pId=849842",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.price",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing price",
      body:
        "Fat-Freezing (Cryolipolysis) — $138/area (intro rate, normally $300+, limited spots then price rises)",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.protocol",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing protocol",
      body:
        "FDA-cleared cryolipolysis, 60 min per area, permanent fat cell destruction via controlled cooling",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.pain",
      category: "faq",
      offerKey: "fat-freeze-138",
      title: "Does fat-freezing hurt",
      body:
        "Does it hurt: intense suction first 5-10 min, then numbs and becomes comfortable",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.results",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing results",
      body: "Results: starts 4-6 weeks, full results 8-12 weeks",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.sessions",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing sessions",
      body:
        "Sessions needed: many see results from one session; stubborn areas may want 2-3 sessions spaced 8-12 weeks apart",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.areas",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing treatment areas",
      body:
        "Areas treated: belly, love handles, arms, thighs, under chin, back fat, bra fat - DK confirms exact areas at consult",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.payment",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing payment",
      body: "No deposit required, no payment until appointment",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.location",
      category: "offer",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing location",
      body:
        "Location note: this offer is Caroline Springs-based per the page, confirm with customer if Moonee Ponds works for them",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.intro-rate",
      category: "policy",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing intro rate caveat",
      body:
        "IMPORTANT: $138 is a limited intro rate (\"price goes up once full\") - don't imply this is the standard ongoing price",
    },
    {
      entryKey: "love-your-skin.fat-freeze-138.booking-url",
      category: "booking",
      offerKey: "fat-freeze-138",
      title: "Fat-freezing booking link",
      body:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?oiid=sv%3A24411275&share=true&pId=849842",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.price",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage price",
      body: "Full Body Lymphatic Drainage — $149",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.session",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage session",
      body:
        "60 min full body session (abdomen, legs, arms), Caroline Springs only",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.description",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "What lymphatic drainage is",
      body:
        "Not a relaxation massage - works on fluid system, not muscle tissue. Gentle rhythmic pressure, not painful",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.purpose",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage purpose",
      body: "Purpose: de-puff, reduce bloating, boost circulation, sculpt/tone support",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.timing",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "When to book lymphatic drainage",
      body:
        "Best booked 2-5 days before an event, not the day before if it's their first time",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.frequency",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage frequency",
      body:
        "Frequency: monthly maintenance typical; weekly for 3-4 weeks then monthly if significant fluid buildup",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.contraindications",
      category: "faq",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage contraindications",
      body:
        "Avoid if: active infection, blood clots, heart conditions, cancer (check with GP first). Mention if pregnant/postpartum when booking",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.cancellation",
      category: "offer",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage cancellation",
      body: "Cancellation: 24 hours notice requested",
    },
    {
      entryKey: "love-your-skin.lymphatic-149.booking-url",
      category: "booking",
      offerKey: "lymphatic-149",
      title: "Lymphatic drainage booking link",
      body:
        "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services?lid=902929&eid=3492257&oiid=sv%3A27121200&share=true&pId=849842",
    },
    {
      entryKey: "love-your-skin.policy.close-mechanics",
      category: "policy",
      title: "Booking mechanics, manual close",
      body:
        "Every offer here is Fresha, so the close is always the same shape: get a real day/time out of the customer in the thread, don't just send a link and hope. Ask a direct scheduling question. Example shape: \"We've got spots Tues arvo or Thurs morning this week at Caroline Springs, what suits you?\" If the customer is near Moonee Ponds, offer that location instead where the offer supports it (Face & Neck HIFU and HIFU Fat-Reduction run at both locations per the page; Fat-Freeze and Lymphatic Drainage pages reference Caroline Springs specifically - if a Moonee Ponds customer asks for these two, check with Theo rather than assuming availability). Once they give a day/time, confirm you'll lock it in - Theo takes it from there and books manually in Fresha.",
    },
    {
      entryKey: "love-your-skin.policy.sms-format",
      category: "policy",
      title: "SMS formatting rules",
      body:
        "No emojis. No em dashes - use full stops or commas instead. No special/smart characters (no curly quotes, no ellipsis character - use three periods only if truly needed, prefer just ending the sentence). Keep it as short as the question allows - match the customer's message length and pace, don't out-text them. Plain, casual Australian tone. Write like a real person on their phone, not a business. No signoffs like \"Best,\" or \"Kind regards\" - it's a text thread, not an email. One question per message where possible - don't stack three questions in one text.",
    },
    {
      entryKey: "love-your-skin.policy.no-negotiation",
      category: "policy",
      title: "What this clinic never does",
      body:
        "Never drafts as if it's sending automatically - every output is for Theo to review. Never negotiates price or discounts beyond what's listed in the offers above. Never answers medical/suitability questions not covered in the offer info above. Never handles refund or complaint messages beyond a holding reply + flag. Never implies an intro price ($99 or $138) is the standard ongoing rate. Never guesses which offer a message relates to without checking - asks Theo if unclear.",
    },
    {
      entryKey: "love-your-skin.policy.outside-scope",
      category: "policy",
      title: "Outside scope enquiries",
      body:
        "Outside scope (medical suitability beyond what's listed above, refund/complaint, price negotiation, anything angry or upset, or a medical condition/contraindication question not covered above): draft a holding reply that doesn't overcommit, and flag clearly at the top: \"FLAG: outside scope - review before sending.\" Do not attempt to resolve complaints or negotiate price. Do not answer medical questions not covered in the offer info above - suggest they raise it at consult or call the clinic directly (0420 307 584).",
    },
    {
      entryKey: "love-your-skin.policy.unmatched-offer",
      category: "policy",
      title: "Enquiry does not match an offer",
      body:
        "KNOWN GAP: if a customer's enquiry doesn't clearly match one of these four offers, or references a price/treatment that doesn't match any of the above, don't guess - ask Theo which campaign this is before drafting.",
    },
    {
      entryKey: "love-your-skin.policy.hesitant-objection",
      category: "policy",
      title: "Hesitant or objection messages",
      body:
        "Hesitant / objection (\"thinking about it\", \"is it worth it\", \"does it actually work\"): brief reassurance using proof points already in the offer info (results %, reviews, permanence, price comparison to other clinics), then a low-friction next step. Don't argue. One line of value, then invite the booking.",
    },
  ],
  sourceAssertions: [
    "$289",
    "$99/area",
    "$299/area",
    "$138/area",
    "$149",
    "https://www.fresha.com/book-now/love-your-skin-tvybs72u/services",
    "0420 307 584",
    "Caroline Springs",
    "Moonee Ponds",
  ],
  importGaps: ["do_not_answer_list", "compliance_block"],
  importNotes: [
    "Two locations with different hours; Fat-Freeze and Lymphatic Drainage are Caroline Springs-based per the page.",
  ],
};
