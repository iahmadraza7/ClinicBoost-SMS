import PgBoss from "pg-boss";

import { env } from "../env";

/**
 * pg-boss runs on the same Postgres as the app, in its own `pgboss` schema.
 * No Redis: the server is 4GB with 8.7GB of disk.
 */
export const QUEUES = {
  draftReply: "draft-reply",
  /**
   * Where a draft-reply job lands once it has exhausted its retries, which in
   * practice means Anthropic was down or the key was rejected for the better
   * part of an hour. The handler writes the enquiry into the approval queue for
   * a hand-written reply, so an outage delays a lead but never loses one.
   */
  draftReplyFailed: "draft-reply-failed",
  /** One job per outbound message, keyed by the message row that already exists. */
  sendSms: "send-sms",
  sendSmsFailed: "send-sms-failed",
  /** Queue-landing email. One job per draft, keyed by the draft id. */
  notifyEmail: "notify-email",
  notifyEmailFailed: "notify-email-failed",
  /**
   * One scheduled sweep for every clinic's unattended queue, rather than a
   * timer per draft. Also re-enqueues any pending draft whose email never
   * landed, so a crash between persist and enqueue is not a silent miss.
   */
  unattendedSweep: "unattended-sweep",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export type DraftReplyJob = {
  clinicId: string;
  conversationId: string;
  inboundMessageId: string;
};

/**
 * Called only after the inbound message is committed. If this throws, the
 * enquiry is already safe in the database and can be re-enqueued.
 */
export async function enqueueDraftReply(job: DraftReplyJob): Promise<string> {
  const boss = await getBoss();
  const jobId = await boss.send(QUEUES.draftReply, job, {
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
    expireInMinutes: 15,
    deadLetter: QUEUES.draftReplyFailed,
  });
  if (!jobId) throw new Error("pg-boss returned no job id");
  return jobId;
}

export type SendSmsKind = "customer" | "operator_alert";

export type SendSmsJob = {
  clinicId: string;
  messageId: string;
  kind?: SendSmsKind;
};

/**
 * Called only after the outbound message row is committed. The row is the
 * record of intent, and the provider is given its id as an idempotency key, so
 * a duplicated job cannot produce a duplicated SMS.
 */
export async function enqueueSendSms(job: SendSmsJob): Promise<string> {
  const boss = await getBoss();
  const jobId = await boss.send(QUEUES.sendSms, job, {
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
    expireInMinutes: 15,
    deadLetter: QUEUES.sendSmsFailed,
    // Belt and braces on top of the provider's idempotency key: two jobs for
    // one message row collapse into one.
    singletonKey: job.messageId,
  });
  if (!jobId) throw new Error("pg-boss returned no job id");
  return jobId;
}

export type NotifyEmailJob = {
  clinicId: string;
  draftId: string;
};

/**
 * Called only after a pending draft is committed. Auto-sent drafts are never
 * enqueued. singletonKey is the draft id so a retry of draft-reply, or the
 * sweep covering a missed enqueue, cannot produce two emails.
 */
export async function enqueueNotifyEmail(job: NotifyEmailJob): Promise<string> {
  const boss = await getBoss();
  const jobId = await boss.send(QUEUES.notifyEmail, job, {
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
    expireInMinutes: 15,
    deadLetter: QUEUES.notifyEmailFailed,
    singletonKey: job.draftId,
  });
  if (!jobId) throw new Error("pg-boss returned no job id");
  return jobId;
}

/** Registers the every-minute unattended sweep. Safe to call on every worker boot. */
export async function scheduleUnattendedSweep(): Promise<void> {
  const boss = await getBoss();
  await boss.schedule(QUEUES.unattendedSweep, "* * * * *", {}, {
    tz: "Australia/Sydney",
    singletonKey: "unattended-sweep",
    singletonSeconds: 55,
  });
}

let instance: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

export function getBoss(): Promise<PgBoss> {
  if (instance) return Promise.resolve(instance);
  if (starting) return starting;

  starting = (async () => {
    const boss = new PgBoss({
      connectionString: env.DATABASE_URL,
      schema: "pgboss",
      // The box is small. Keep the pool tight.
      max: 4,
    });
    boss.on("error", (error) => console.error("pg-boss error:", error));
    await boss.start();
    // A dead letter queue has to exist before the queue that points at it.
    await boss.createQueue(QUEUES.draftReplyFailed);
    await boss.createQueue(QUEUES.draftReply, {
      name: QUEUES.draftReply,
      deadLetter: QUEUES.draftReplyFailed,
    });
    await boss.createQueue(QUEUES.sendSmsFailed);
    await boss.createQueue(QUEUES.sendSms, {
      name: QUEUES.sendSms,
      deadLetter: QUEUES.sendSmsFailed,
    });
    await boss.createQueue(QUEUES.notifyEmailFailed);
    await boss.createQueue(QUEUES.notifyEmail, {
      name: QUEUES.notifyEmail,
      deadLetter: QUEUES.notifyEmailFailed,
    });
    await boss.createQueue(QUEUES.unattendedSweep);
    instance = boss;
    return boss;
  })();

  return starting;
}

export async function stopBoss(): Promise<void> {
  if (!instance) return;
  await instance.stop({ graceful: true });
  instance = null;
  starting = null;
}
