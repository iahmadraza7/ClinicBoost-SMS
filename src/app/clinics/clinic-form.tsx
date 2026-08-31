"use client";

import { useActionState } from "react";

import {
  BOOKING_PLATFORMS,
  CLOSE_TYPE_CHOICES,
  VOICE_HELP,
  widgetOriginsText,
} from "@/server/clinics/fields";
import type { BookingPlatform, CloseType } from "@/server/db/schema";
import {
  createClinic,
  updateClinic,
  type ClinicActionState,
} from "./actions";

export type ClinicFormValues = {
  slug: string;
  name: string;
  location: string;
  hours: string | null;
  phone: string | null;
  paymentNotes: string | null;
  bookingPlatform: BookingPlatform;
  closeType: CloseType;
  smsNumber: string | null;
  confidenceThreshold: number;
  killSwitch: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  unattendedMinutes: number;
  widgetOrigins: string[];
  widgetTheme: {
    accent?: string;
    heading?: string;
    buttonLabel?: string;
    intro?: string;
    preview?: string;
    iconUrl?: string;
  } | null;
  voice: string | null;
  voicePending: string | null;
};

export function ClinicForm({
  mode,
  clinic,
}: {
  mode: "create" | "edit";
  clinic?: ClinicFormValues;
}) {
  const action =
    mode === "create"
      ? createClinic
      : updateClinic.bind(null, clinic?.slug ?? "");

  const [state, formAction, pending] = useActionState<
    ClinicActionState,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="space-y-8">
      {mode === "create" ? (
        <Field
          label="Slug"
          hint="Used in the widget URL and in /clinics/.... Lowercase, hyphens, cannot be changed later."
        >
          <input
            name="slug"
            required
            autoComplete="off"
            placeholder="beauty-soiree"
            className={inputClass}
          />
        </Field>
      ) : (
        <p className="text-sm text-neutral-600">
          Slug <span className="font-mono text-neutral-900">{clinic?.slug}</span>
          <span className="text-neutral-500"> (cannot be changed)</span>
        </p>
      )}

      <Field label="Name">
        <input
          name="name"
          required
          defaultValue={clinic?.name ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Location">
        <input
          name="location"
          required
          defaultValue={clinic?.location ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Hours"
        hint="Leave blank if hours are not confirmed. The model will then refuse to state them."
      >
        <input
          name="hours"
          defaultValue={clinic?.hours ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Phone">
        <input
          name="phone"
          defaultValue={clinic?.phone ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Payment notes">
        <input
          name="paymentNotes"
          defaultValue={clinic?.paymentNotes ?? ""}
          placeholder="Afterpay available on both offers."
          className={inputClass}
        />
      </Field>

      <Field label="Booking platform">
        <select
          name="bookingPlatform"
          required
          defaultValue={clinic?.bookingPlatform ?? ""}
          className={inputClass}
        >
          {mode === "create" && <option value="">Select one</option>}
          {BOOKING_PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">
          How does a booking get confirmed?
        </legend>
        <p className="mt-1 text-sm text-neutral-600">
          This is the behaviour the drafts will follow. Pick the one that is
          true for this clinic.
        </p>
        <div className="mt-3 grid gap-3">
          {CLOSE_TYPE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-neutral-200 bg-white p-4 has-[:checked]:border-neutral-900"
            >
              <input
                type="radio"
                name="closeType"
                value={choice.value}
                required
                defaultChecked={clinic?.closeType === choice.value}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">
                  {choice.title}
                </span>
                <span className="mt-1 block text-sm text-neutral-600">
                  {choice.consequence}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="SMS number"
        hint="Dedicated Australian mobile once one is bought. Leave blank while sharing the test number."
      >
        <input
          name="smsNumber"
          defaultValue={clinic?.smsNumber ?? ""}
          placeholder="0405 111 222"
          className={inputClass}
        />
      </Field>

      <Field label="Voice" hint={VOICE_HELP}>
        <textarea
          name="voice"
          rows={5}
          defaultValue={
            clinic?.voicePending !== null && clinic?.voicePending !== undefined
              ? clinic.voicePending
              : (clinic?.voice ?? "")
          }
          placeholder="Leave blank for the default Australian SMS tone."
          className={inputClass}
        />
      </Field>

      <Field
        label="Confidence threshold"
        hint="A draft only auto-sends if every fact is grounded and the model's self-reported confidence is at least this. Default 90."
      >
        <input
          name="confidenceThreshold"
          type="number"
          min={1}
          max={100}
          required
          defaultValue={clinic?.confidenceThreshold ?? 90}
          className={`${inputClass} max-w-24`}
        />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-900">
          Sending and alerts
        </legend>
        <Check
          name="killSwitch"
          defaultChecked={clinic?.killSwitch ?? false}
          label="Kill switch"
          hint="Stop all customer SMS from this clinic. Drafts still land in the queue. Operator alerts are not blocked by this."
          tone="danger"
        />
        <Check
          name="notifyEmail"
          defaultChecked={clinic?.notifyEmail ?? true}
          label="Email me when a draft is queued"
          hint="Clinic name and a dashboard link only. No customer details."
        />
        <Check
          name="notifySms"
          defaultChecked={clinic?.notifySms ?? false}
          label="SMS me if a draft sits unattended"
          hint="Same payload as the email. Off by default so the test credits stay unused."
        />
      </fieldset>

      <Field
        label="Unattended window (minutes)"
        hint="How long a queued draft may sit before the SMS alert. Default 15."
      >
        <input
          name="unattendedMinutes"
          type="number"
          min={1}
          max={1440}
          required
          defaultValue={clinic?.unattendedMinutes ?? 15}
          className={`${inputClass} max-w-24`}
        />
      </Field>

      <Field
        label="Widget origins"
        hint="One origin per line. The widget only accepts browser posts from these pages. Empty means no cross-origin submissions."
      >
        <textarea
          name="widgetOrigins"
          rows={4}
          defaultValue={widgetOriginsText(clinic?.widgetOrigins ?? [])}
          placeholder="https://offers.thebeautysoiree.com.au"
          className={inputClass}
        />
      </Field>

      <Field
        label="Widget heading"
        hint="Shown at the top of the open panel. Leave blank to use the clinic name."
      >
        <input
          name="widgetHeading"
          defaultValue={clinic?.widgetTheme?.heading ?? ""}
          placeholder="Ask us a question"
          className={inputClass}
        />
      </Field>

      <Field
        label="Widget intro"
        hint="One line under the heading in the open panel."
      >
        <input
          name="widgetIntro"
          defaultValue={clinic?.widgetTheme?.intro ?? ""}
          placeholder="Leave your name, mobile and question. We will text you back."
          className={inputClass}
        />
      </Field>

      <Field
        label="Widget preview"
        hint="Text beside the collapsed bubble."
      >
        <input
          name="widgetPreview"
          defaultValue={clinic?.widgetTheme?.preview ?? ""}
          placeholder="Ask us a question"
          className={inputClass}
        />
      </Field>

      <Field
        label="Widget icon URL"
        hint="Image URL for the collapsed bubble. No file upload. Leave blank for the first letter of the heading."
      >
        <input
          name="widgetIconUrl"
          defaultValue={clinic?.widgetTheme?.iconUrl ?? ""}
          placeholder="https://example.com/icon.png"
          className={inputClass}
        />
      </Field>

      <Field
        label="Widget button"
        hint="The submit label. Leave blank for Send."
      >
        <input
          name="widgetButtonLabel"
          defaultValue={clinic?.widgetTheme?.buttonLabel ?? ""}
          placeholder="Send"
          className={`${inputClass} max-w-xs`}
        />
      </Field>

      <Field
        label="Widget accent"
        hint="Hex colour for the bubble and send button, e.g. #171717. Leave blank for black."
      >
        <input
          name="widgetAccent"
          defaultValue={clinic?.widgetTheme?.accent ?? ""}
          placeholder="#171717"
          className={`${inputClass} max-w-40`}
        />
      </Field>

      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state && "saved" in state && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-40"
      >
        {pending
          ? "Saving..."
          : mode === "create"
            ? "Create clinic"
            : "Save changes"}
      </button>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-neutral-900">{label}</span>
      {hint && <span className="mt-0.5 block text-neutral-600">{hint}</span>}
      {children}
    </label>
  );
}

function Check({
  name,
  defaultChecked,
  label,
  hint,
  tone = "default",
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint: string;
  tone?: "default" | "danger";
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <span>
        <span
          className={`block text-sm font-medium ${
            tone === "danger" ? "text-red-800" : "text-neutral-900"
          }`}
        >
          {label}
        </span>
        <span className="mt-1 block text-sm text-neutral-600">{hint}</span>
      </span>
    </label>
  );
}
