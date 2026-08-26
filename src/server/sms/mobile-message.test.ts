import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";

import { MobileMessageAdapter } from "./mobile-message";
import { RecipientOptedOutError, SmsError, type OutboundSms } from "./types";

/**
 * Driven against a local stand-in for the API rather than mocked fetch, so the
 * headers, the body and the status handling are all exercised for real. No
 * credits are involved.
 */

type Captured = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body: string;
};

let server: Server | null = null;
const captured: Captured[] = [];

async function startFake(
  respond: (request: Captured) => { status: number; body: string },
): Promise<string> {
  server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const request: Captured = {
        method: req.method ?? "",
        path: req.url ?? "",
        headers: req.headers as Record<string, string | undefined>,
        body,
      };
      captured.push(request);
      const reply = respond(request);
      res.writeHead(reply.status, { "Content-Type": "application/json" });
      res.end(reply.body);
    });
  });

  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address === "string" || address === null) {
    throw new Error("fake server did not bind a port");
  }
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  captured.length = 0;
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
});

const sms: OutboundSms = {
  to: "+61405111222",
  from: "+61485900170",
  body: "Hey! The appointment is 60 minutes.",
  reference: "01a03e10-c8be-7304-9a8c-a3bbd385482f",
  maxSegments: 3,
};

function adapterFor(baseUrl: string) {
  return new MobileMessageAdapter({
    apiUser: "user123",
    apiPassword: "mypassword",
    baseUrl,
  });
}

const success = JSON.stringify({
  status: "complete",
  results: [
    {
      to: "61405111222",
      status: "success",
      cost: 2,
      message_id: "abcd1234-efgh-5678-ijkl-9876543210mn",
    },
  ],
});

describe("sending", () => {
  it("returns the provider id and the billed segment count", async () => {
    const url = await startFake(() => ({ status: 200, body: success }));

    await expect(adapterFor(url).send(sms)).resolves.toEqual({
      providerMessageId: "abcd1234-efgh-5678-ijkl-9876543210mn",
      segments: 2,
    });
  });

  it("authenticates with base64 basic auth", async () => {
    const url = await startFake(() => ({ status: 200, body: success }));
    await adapterFor(url).send(sms);

    const expected = Buffer.from("user123:mypassword").toString("base64");
    expect(captured[0].headers.authorization).toBe(`Basic ${expected}`);
  });

  it("sends our message id as the idempotency key, so a retry cannot bill twice", async () => {
    const url = await startFake(() => ({ status: 200, body: success }));
    await adapterFor(url).send(sms);

    expect(captured[0].headers["idempotency-key"]).toBe(sms.reference);
  });

  it("posts one message carrying the reference and the segment cap", async () => {
    const url = await startFake(() => ({ status: 200, body: success }));
    await adapterFor(url).send(sms);

    expect(captured[0].method).toBe("POST");
    expect(captured[0].path).toBe("/v1/messages");
    expect(JSON.parse(captured[0].body)).toEqual({
      messages: [
        {
          to: "61405111222",
          message: sms.body,
          sender: "61485900170",
          custom_ref: sms.reference,
        },
      ],
      max_parts: 3,
    });
  });

  it("drops the plus, because sender IDs are registered without one", async () => {
    const url = await startFake(() => ({ status: 200, body: success }));
    await adapterFor(url).send(sms);

    const sent = JSON.parse(captured[0].body).messages[0];
    expect(sent.sender).toBe("61485900170");
    expect(sent.to).toBe("61405111222");
  });

  it("leaves an alphanumeric sender ID alone", async () => {
    const url = await startFake(() => ({ status: 200, body: success }));
    await adapterFor(url).send({ ...sms, from: "BeautySoiree" });

    expect(JSON.parse(captured[0].body).messages[0].sender).toBe("BeautySoiree");
  });
});

describe("a 200 that did not actually send", () => {
  it("raises opted out when the provider blocked the recipient", async () => {
    const url = await startFake(() => ({
      status: 200,
      body: JSON.stringify({ status: "complete", results: [{ status: "blocked" }] }),
    }));

    await expect(adapterFor(url).send(sms)).rejects.toBeInstanceOf(
      RecipientOptedOutError,
    );
  });

  it("surfaces a per-message error and does not retry it", async () => {
    const url = await startFake(() => ({
      status: 200,
      body: JSON.stringify({
        status: "complete",
        results: [{ status: "error", error: "Invalid mobile number" }],
      }),
    }));

    await expect(adapterFor(url).send(sms)).rejects.toMatchObject({
      retryable: false,
      message: expect.stringContaining("Invalid mobile number"),
    });
  });

  it("refuses a success with no message id rather than inventing one", async () => {
    const url = await startFake(() => ({
      status: 200,
      body: JSON.stringify({ status: "complete", results: [{ status: "success" }] }),
    }));

    await expect(adapterFor(url).send(sms)).rejects.toBeInstanceOf(SmsError);
  });
});

describe("deciding what is worth retrying", () => {
  it("does not retry rejected credentials", async () => {
    const url = await startFake(() => ({ status: 401, body: '{"error":"nope"}' }));

    await expect(adapterFor(url).send(sms)).rejects.toMatchObject({
      retryable: false,
    });
  });

  it("does not retry a payload the provider will always refuse", async () => {
    const url = await startFake(() => ({ status: 400, body: '{"error":"bad"}' }));

    await expect(adapterFor(url).send(sms)).rejects.toMatchObject({
      retryable: false,
    });
  });

  it("retries a rate limit", async () => {
    const url = await startFake(() => ({ status: 429, body: "slow down" }));

    await expect(adapterFor(url).send(sms)).rejects.toMatchObject({
      retryable: true,
    });
  });

  it("retries a provider fault", async () => {
    const url = await startFake(() => ({ status: 503, body: "unavailable" }));

    await expect(adapterFor(url).send(sms)).rejects.toMatchObject({
      retryable: true,
    });
  });

  it("retries when the provider cannot be reached at all", async () => {
    // Port 1 is reserved and nothing listens on it.
    await expect(
      adapterFor("http://127.0.0.1:1").send(sms),
    ).rejects.toMatchObject({ retryable: true });
  });
});

describe("balance", () => {
  it("reads the credit balance for the health panel", async () => {
    const url = await startFake(() => ({
      status: 200,
      body: JSON.stringify({ status: "complete", credit_balance: 50 }),
    }));

    await expect(adapterFor(url).balance()).resolves.toBe(50);
    expect(captured[0].path).toBe("/v1/account");
  });
});
