import { NextResponse } from "next/server";

import { env } from "@/server/env";
import * as repo from "@/server/repo";
import { resolveClinicForNumber } from "@/server/sms/routing";
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyWebhook,
} from "@/server/sms/signature";
import {
  isFinalPart,
  mapProviderStatus,
  statusPayloadSchema,
} from "@/server/sms/webhook-payloads";

/**
 * Delivery receipts from Mobile Message.
 *
 * "Sent" only means the provider accepted it. This is how a message becomes
 * `delivered`, or `failed` when the handset never got it, which is the
 * difference between a lead who ignored a reply and one who never saw it.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const verified = verifyWebhook({
    secret: env.MOBILE_MESSAGE_WEBHOOK_SECRET ?? "",
    rawBody,
    timestamp: request.headers.get(TIMESTAMP_HEADER),
    signature: request.headers.get(SIGNATURE_HEADER),
  });

  if (!verified.ok) {
    console.error(`status webhook rejected: ${verified.reason}`);
    return new NextResponse(null, { status: verified.status });
  }

  const parsed = statusPayloadSchema.safeParse(safeJson(rawBody));
  if (!parsed.success) {
    console.error("status webhook payload did not match the expected shape");
    return new NextResponse(null, { status: 400 });
  }

  const payload = parsed.data;

  // Each part of a multi-part message reports separately. Only the last one
  // settles the message.
  if (!isFinalPart(payload)) {
    return NextResponse.json({ received: true, applied: false });
  }

  const status = mapProviderStatus(payload.status);
  if (!status) {
    console.error(`status webhook carried an unknown status: ${payload.status}`);
    return NextResponse.json({ received: true, applied: false });
  }

  const routing = await resolveClinicForNumber(payload.sender);
  if (!routing.clinic) {
    console.error(`status webhook could not be routed: ${routing.reason}`);
    return NextResponse.json({ received: true, applied: false });
  }

  const clinicId = routing.clinic.id;

  try {
    const message = await repo.messages.getMessageByProviderId(
      clinicId,
      payload.message_id,
    );

    if (!message) {
      // Expected while the test number is shared: a receipt for another
      // clinic's message routes here and finds nothing of ours.
      return NextResponse.json({ received: true, applied: false });
    }

    if (message.status === status) {
      return NextResponse.json({ received: true, applied: false });
    }

    await repo.messages.setMessageStatus(clinicId, message.id, status);

    await repo.audit.recordAudit(clinicId, {
      actor: "mobile_message",
      action: `sms.${status}`,
      entityType: "message",
      entityId: message.id,
      before: { status: message.status },
      after: { status, provider_status: payload.status },
    });

    return NextResponse.json({ received: true, applied: true });
  } catch (error) {
    console.error("status webhook failed to apply the update:", error);
    return new NextResponse(null, { status: 500 });
  }
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
