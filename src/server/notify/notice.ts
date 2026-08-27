/**
 * The only two things an operator notification is allowed to carry.
 *
 * Resend stores every payload in the US. Enquiry text, mobile numbers and
 * names stay in Sydney, so they must not appear here, not even as a
 * convenience for the operator. The dashboard link is how they see the rest.
 */
export type QueueNotice = {
  clinicName: string;
  dashboardUrl: string;
};

export function queueNotice(
  clinic: { name: string },
  appUrl: string,
): QueueNotice {
  const base = appUrl.replace(/\/+$/, "");
  return {
    clinicName: clinic.name,
    dashboardUrl: `${base}/queue`,
  };
}

export function renderQueueEmail(notice: QueueNotice): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `ClinicBoost: a draft is waiting for ${notice.clinicName}`;
  const text = [
    `${notice.clinicName} has a reply waiting in the approval queue.`,
    "",
    `Open the queue: ${notice.dashboardUrl}`,
  ].join("\n");
  const html = [
    `<p>${escapeHtml(notice.clinicName)} has a reply waiting in the approval queue.</p>`,
    `<p><a href="${escapeHtml(notice.dashboardUrl)}">Open the queue</a></p>`,
  ].join("");

  return { subject, text, html };
}

export function renderQueueSms(notice: QueueNotice): string {
  return `${notice.clinicName} has a draft waiting. Open the queue: ${notice.dashboardUrl}`;
}

export type QueueEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

/**
 * Assembles the Resend payload from a notice. The only inputs are clinic name,
 * a dashboard URL, and the envelope. Callers that hold a draft or a contact
 * must not pass those objects in.
 */
export function buildQueueEmail(args: {
  notice: QueueNotice;
  from: string;
  to: string;
  idempotencyKey: string;
}): QueueEmail {
  const rendered = renderQueueEmail(args.notice);
  return {
    from: args.from,
    to: args.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: args.idempotencyKey,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
