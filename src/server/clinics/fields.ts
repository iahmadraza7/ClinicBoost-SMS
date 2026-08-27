import { z } from "zod";

import { formatAuMobile, normaliseAuMobile } from "@/lib/mobile";
import type { BookingPlatform, CloseType } from "../db/schema";

/**
 * A missing dedicated number is a clinic that cannot send or receive. Say so
 * on the list and the detail page, the same way the queue says "test mode"
 * rather than leaving a blank.
 */
export const SMS_NOT_CONNECTED =
  "Not connected. No dedicated number. Cannot send or receive.";

export function clinicSmsLabel(smsNumber: string | null): {
  connected: boolean;
  label: string;
} {
  if (!smsNumber) {
    return { connected: false, label: SMS_NOT_CONNECTED };
  }
  return {
    connected: true,
    label: `Sending and receiving on ${formatAuMobile(smsNumber)}`,
  };
}

/**
 * The operator is picking how bookings get confirmed, not a schema label.
 * These strings are what the form shows; `link_only` / `manual` stay in the
 * database so the prompt and the validator keep working.
 */
export const CLOSE_TYPE_CHOICES: {
  value: CloseType;
  title: string;
  consequence: string;
}[] = [
  {
    value: "link_only",
    title: "The customer confirms it themselves",
    consequence:
      "They pick a time on the booking link and it is done. Replies may send that link as the whole close. They must never be told someone will get back to them.",
  },
  {
    value: "manual",
    title: "Someone at the clinic confirms it",
    consequence:
      "A person still has to come back to the customer. Replies must never tell them the booking is confirmed, held, or locked in.",
  },
];

export const BOOKING_PLATFORMS: { value: BookingPlatform; label: string }[] = [
  { value: "fresha", label: "Fresha" },
  { value: "timely", label: "Timely" },
  { value: "wix", label: "Wix" },
  { value: "other", label: "Other" },
];

const RESERVED_SLUGS = new Set([
  "new",
  "queue",
  "login",
  "clinics",
  "api",
  "health",
]);

export const clinicFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  location: z.string().trim().min(1, "Location is required").max(300),
  hours: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v)),
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v)),
  paymentNotes: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v)),
  bookingPlatform: z.enum(["fresha", "timely", "wix", "other"]),
  closeType: z.enum(["link_only", "manual"], {
    message: "Pick how a booking gets confirmed",
  }),
  smsNumber: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const mobile = normaliseAuMobile(v);
      if (!mobile) {
        ctx.addIssue({
          code: "custom",
          message: "SMS number must be an Australian mobile, e.g. 0405 111 222",
        });
        return z.NEVER;
      }
      return mobile;
    }),
  confidenceThreshold: z.coerce
    .number()
    .int()
    .min(1, "Threshold is 1 to 100")
    .max(100, "Threshold is 1 to 100"),
  killSwitch: z.boolean(),
  notifyEmail: z.boolean(),
  notifySms: z.boolean(),
  unattendedMinutes: z.coerce
    .number()
    .int()
    .min(1, "Unattended window is at least 1 minute")
    .max(24 * 60, "Unattended window cannot exceed a day"),
  widgetOrigins: z.array(z.string()),
  widgetTheme: z
    .object({
      accent: z.string().optional(),
      heading: z.string().optional(),
      buttonLabel: z.string().optional(),
    })
    .nullable(),
});

export const clinicSlugSchema = z
  .string()
  .trim()
  .min(2, "Slug is at least 2 characters")
  .max(64, "Slug is at most 64 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug is lowercase letters, numbers and hyphens, e.g. beauty-soiree",
  )
  .refine((slug) => !RESERVED_SLUGS.has(slug), "That slug is reserved");

export const createClinicSchema = clinicFieldsSchema.extend({
  slug: clinicSlugSchema,
});

export type ClinicFields = z.infer<typeof clinicFieldsSchema>;
export type CreateClinicFields = z.infer<typeof createClinicSchema>;

export function parseWidgetOrigins(raw: string): string[] | { error: string } {
  const origins: string[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return { error: `"${trimmed}" is not a URL` };
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: `"${trimmed}" must start with http:// or https://` };
    }
    if (url.username || url.password) {
      return { error: `"${trimmed}" cannot include a username or password` };
    }
    if (url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
      return {
        error: `"${trimmed}" must be an origin only, e.g. https://offers.example.com.au`,
      };
    }

    const origin = `${url.protocol}//${url.host}`.toLowerCase();
    if (!seen.has(origin)) {
      seen.add(origin);
      origins.push(origin);
    }
  }

  return origins;
}

export function widgetOriginsText(origins: string[]): string {
  return origins.join("\n");
}

export function parseWidgetTheme(form: FormData):
  | { theme: { accent?: string; heading?: string; buttonLabel?: string } | null }
  | { error: string } {
  const accent = String(form.get("widgetAccent") ?? "").trim();
  const heading = String(form.get("widgetHeading") ?? "").trim();
  const buttonLabel = String(form.get("widgetButtonLabel") ?? "").trim();

  if (accent && !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent)) {
    return { error: "Widget accent must be a hex colour, e.g. #171717" };
  }

  if (!accent && !heading && !buttonLabel) return { theme: null };

  return {
    theme: {
      ...(accent ? { accent } : {}),
      ...(heading ? { heading: heading.slice(0, 80) } : {}),
      ...(buttonLabel ? { buttonLabel: buttonLabel.slice(0, 40) } : {}),
    },
  };
}

export function parseCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on";
}

export function clinicFieldsFromForm(form: FormData): {
  fields?: ClinicFields;
  error?: string;
} {
  const origins = parseWidgetOrigins(String(form.get("widgetOrigins") ?? ""));
  if (!Array.isArray(origins)) return { error: origins.error };

  const theme = parseWidgetTheme(form);
  if ("error" in theme) return { error: theme.error };

  const parsed = clinicFieldsSchema.safeParse({
    name: form.get("name"),
    location: form.get("location"),
    hours: form.get("hours") ?? "",
    phone: form.get("phone") ?? "",
    paymentNotes: form.get("paymentNotes") ?? "",
    bookingPlatform: form.get("bookingPlatform"),
    closeType: form.get("closeType"),
    smsNumber: form.get("smsNumber") ?? "",
    confidenceThreshold: form.get("confidenceThreshold"),
    killSwitch: parseCheckbox(form.get("killSwitch")),
    notifyEmail: parseCheckbox(form.get("notifyEmail")),
    notifySms: parseCheckbox(form.get("notifySms")),
    unattendedMinutes: form.get("unattendedMinutes"),
    widgetOrigins: origins,
    widgetTheme: theme.theme,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid clinic" };
  }
  return { fields: parsed.data };
}

/** The columns the operator can change, for before/after in the audit log. */
export function clinicAuditShape(clinic: {
  slug: string;
  name: string;
  location: string;
  hours: string | null;
  phone: string | null;
  paymentNotes: string | null;
  bookingPlatform: string;
  closeType: string;
  smsNumber: string | null;
  confidenceThreshold: number;
  killSwitch: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  unattendedMinutes: number;
  widgetOrigins: string[];
  archivedAt: Date | null;
  widgetTheme: { accent?: string; heading?: string; buttonLabel?: string } | null;
}) {
  return {
    slug: clinic.slug,
    name: clinic.name,
    location: clinic.location,
    hours: clinic.hours,
    phone: clinic.phone,
    payment_notes: clinic.paymentNotes,
    booking_platform: clinic.bookingPlatform,
    close_type: clinic.closeType,
    sms_number: clinic.smsNumber,
    confidence_threshold: clinic.confidenceThreshold,
    kill_switch: clinic.killSwitch,
    notify_email: clinic.notifyEmail,
    notify_sms: clinic.notifySms,
    unattended_minutes: clinic.unattendedMinutes,
    widget_origins: clinic.widgetOrigins,
    widget_theme: clinic.widgetTheme,
    archived_at: clinic.archivedAt?.toISOString() ?? null,
  };
}
