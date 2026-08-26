import { NextResponse } from "next/server";

import { env } from "@/server/env";
import * as repo from "@/server/repo";
import { receiveInbound } from "@/server/sms/inbound";
import { resolveClinicForNumber } from "@/server/sms/routing";
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyWebhook,
} from "@/server/sms/signature";
import { inboundPayloadSchema } from "@/server/sms/webhook-payloads";

/**
 * Inbound SMS from Mobile Message: a customer reply, or an opt-out.
 *
 * Signature verification is mandatory. This endpoint writes to the database and
 * causes an AI call, so an unverified request is both a data integrity problem
 * and a way to spend someone else's money.
 */
export async function POST(request: Request) {
  // Read the raw text. Parsing and re-serialising would change the bytes and
  // the signature would never match.
  const rawBody = await request.text();

  const verified = verifyWebhook({
    secret: env.MOBILE_MESSAGE_WEBHOOK_SECRET ?? "",
    rawBody,
    timestamp: request.headers.get(TIMESTAMP_HEADER),
    signature: request.headers.get(SIGNATURE_HEADER),
  });

  if (!verified.ok) {
    console.error(`inbound webhook rejected: ${verified.reason}`);
    return new NextResponse(null, { status: verified.status });
  }

  const parsed = inboundPayloadSchema.safeParse(safeJson(rawBody));
  if (!parsed.success) {
    console.error("inbound webhook payload did not match the expected shape");
    return new NextResponse(null, { status: 400 });
  }

  const routing = await resolveClinicForNumber(parsed.data.to);
  if (!routing.clinic) {
    // 200 on purpose. The provider retries a non-2xx up to ten times, and no
    // number of retries will make this message belong to a clinic.
    console.error(`inbound webhook could not be routed: ${routing.reason}`);
    return NextResponse.json({ received: true, routed: false });
  }

  try {
    const result = await receiveInbound(routing.clinic, parsed.data);

    if (routing.shared && result.kind !== "ignored") {
      await repo.audit.recordAudit(routing.clinic.id, {
        actor: "mobile_message",
        action: "inbound.routed_by_fallback",
        entityType: "clinic",
        entityId: routing.clinic.id,
        after: {
          to: parsed.data.to,
          detail:
            "no clinic claims this number, so SHARED_NUMBER_CLINIC_SLUG decided the owner",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes the provider retry, which is what we want: the message has
    // not been stored and retrying is the only way it will be.
    console.error("inbound webhook failed to store the message:", error);
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
