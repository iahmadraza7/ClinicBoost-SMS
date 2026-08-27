import { NextResponse, type NextRequest } from "next/server";

import * as repo from "@/server/repo";
import { corsHeaders, isCrossOriginRejected } from "@/server/widget/cors";
import { hit, PER_IP, PER_MOBILE } from "@/server/widget/rate-limit";
import {
  submitEnquiry,
  widgetSubmissionSchema,
} from "@/server/widget/submit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ clinicSlug: string }> };

function clientIp(request: NextRequest): string {
  // Caddy sets X-Forwarded-For. Take the first hop, which is the real client.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function OPTIONS(request: NextRequest, { params }: Params) {
  const { clinicSlug } = await params;
  const clinic = await repo.clinics.getClinicBySlug(clinicSlug);
  if (!clinic) return new NextResponse(null, { status: 404 });
  if (clinic.archivedAt) return new NextResponse(null, { status: 404 });

  const origin = request.headers.get("origin");
  const headers = corsHeaders(clinic, origin);
  if (Object.keys(headers).length === 0) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { clinicSlug } = await params;

  const clinic = await repo.clinics.getClinicBySlug(clinicSlug);
  if (!clinic || clinic.archivedAt) {
    return NextResponse.json({ error: "Unknown clinic" }, { status: 404 });
  }

  const origin = request.headers.get("origin");
  if (isCrossOriginRejected(clinic, origin)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  const headers = corsHeaders(clinic, origin);

  const ipLimit = hit(`ip:${clinic.id}:${clientIp(request)}`, PER_IP);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many enquiries. Try again shortly." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(ipLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const parsed = widgetSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid submission",
        fields: Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      },
      { status: 400, headers },
    );
  }

  const mobileLimit = hit(
    `mobile:${clinic.id}:${parsed.data.mobile}`,
    PER_MOBILE,
  );
  if (!mobileLimit.allowed) {
    return NextResponse.json(
      { error: "We already have your enquiry. We will be in touch shortly." },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(mobileLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    await submitEnquiry(clinic, parsed.data);
  } catch (error) {
    console.error("widget submission failed:", error);
    return NextResponse.json(
      { error: "Could not save your enquiry. Please try again." },
      { status: 500, headers },
    );
  }

  // The response carries no enquiry detail back, only an acknowledgement.
  return NextResponse.json({ received: true }, { status: 202, headers });
}
