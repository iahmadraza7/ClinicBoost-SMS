import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/app/dashboard-header";
import { requireOperator } from "@/server/auth";
import { env } from "@/server/env";
import * as repo from "@/server/repo";

import { ArchiveControls } from "../archive-controls";
import { ClinicForm } from "../clinic-form";
import { ClinicSectionNav } from "../clinic-section-nav";
import { SmsStatus } from "../sms-status";
import { VoiceReviewControls } from "../voice-controls";
import { WidgetPreview } from "../widget-preview";

export const dynamic = "force-dynamic";

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const operator = await requireOperator();
  const { slug } = await params;
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <DashboardHeader email={operator.email} current="clinics">
        <p className="mt-3 text-sm">
          <Link href="/clinics" className="text-neutral-600 hover:text-neutral-900">
            Clinics
          </Link>
          <span className="text-neutral-400"> / </span>
          <span className="text-neutral-900">{clinic.slug}</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">{clinic.name}</h1>
        <div className="mt-2">
          <SmsStatus smsNumber={clinic.smsNumber} />
        </div>
        {clinic.archivedAt && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Archived. The widget and the approval queue ignore this clinic.
            Restore it to edit or to take enquiries again.
          </p>
        )}
      </DashboardHeader>

      <ClinicSectionNav slug={clinic.slug} current="settings" />

      {clinic.archivedAt ? (
        <ArchiveControls slug={clinic.slug} archived />
      ) : (
        <>
          {clinic.voicePending !== null && (
            <div className="mb-6">
              <VoiceReviewControls slug={clinic.slug} />
            </div>
          )}
          <ClinicForm
            mode="edit"
            clinic={{
              slug: clinic.slug,
              name: clinic.name,
              location: clinic.location,
              hours: clinic.hours,
              phone: clinic.phone,
              paymentNotes: clinic.paymentNotes,
              bookingPlatform: clinic.bookingPlatform,
              closeType: clinic.closeType,
              smsNumber: clinic.smsNumber,
              confidenceThreshold: clinic.confidenceThreshold,
              killSwitch: clinic.killSwitch,
              notifyEmail: clinic.notifyEmail,
              notifySms: clinic.notifySms,
              unattendedMinutes: clinic.unattendedMinutes,
              widgetOrigins: clinic.widgetOrigins,
              widgetTheme: clinic.widgetTheme,
              voice: clinic.voice,
              voicePending: clinic.voicePending,
            }}
          />
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-medium text-neutral-900">Widget</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste this on the clinic landing page. It works in Elementor and
              on a plain WordPress page. The form is isolated from the page
              styles.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-800">
              {`<script src="${env.APP_URL}/widget.js" data-clinic="${clinic.slug}"></script>`}
            </pre>
            <p className="mt-4 text-sm text-neutral-600">
              Try it here. Submitting creates a real enquiry.
            </p>
            <div className="mt-3">
              <WidgetPreview slug={clinic.slug} />
            </div>
          </div>
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-medium text-neutral-900">Archive</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Stops the widget and removes this clinic from the queue. Contacts,
              drafts and the audit log stay put.
            </p>
            <div className="mt-3">
              <ArchiveControls slug={clinic.slug} archived={false} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
