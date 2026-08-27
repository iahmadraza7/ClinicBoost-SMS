import "../server/bootstrap-env";

import {
  getBoss,
  QUEUES,
  scheduleUnattendedSweep,
  stopBoss,
  type DraftReplyJob,
  type NotifyEmailJob,
  type SendSmsJob,
} from "../server/queue/boss";
import {
  handleDraftReply,
  handleDraftReplyFailed,
} from "./jobs/draft-reply";
import {
  handleNotifyEmail,
  handleNotifyEmailFailed,
} from "./jobs/notify-email";
import { handleSendSms, handleSendSmsFailed } from "./jobs/send-sms";
import { handleUnattendedSweep } from "./jobs/unattended-sweep";

async function main() {
  const boss = await getBoss();

  await boss.work<DraftReplyJob>(
    QUEUES.draftReply,
    { batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        await handleDraftReply(job.data);
      }
    },
  );

  await boss.work<DraftReplyJob>(
    QUEUES.draftReplyFailed,
    { batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        await handleDraftReplyFailed(job.data);
      }
    },
  );

  await boss.work<SendSmsJob>(QUEUES.sendSms, { batchSize: 1 }, async (jobs) => {
    for (const job of jobs) {
      await handleSendSms(job.data);
    }
  });

  await boss.work<SendSmsJob>(
    QUEUES.sendSmsFailed,
    { batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        await handleSendSmsFailed(job.data);
      }
    },
  );

  await boss.work<NotifyEmailJob>(
    QUEUES.notifyEmail,
    { batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        await handleNotifyEmail(job.data);
      }
    },
  );

  await boss.work<NotifyEmailJob>(
    QUEUES.notifyEmailFailed,
    { batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        await handleNotifyEmailFailed(job.data);
      }
    },
  );

  await boss.work(QUEUES.unattendedSweep, { batchSize: 1 }, async (jobs) => {
    for (const job of jobs) {
      void job;
      await handleUnattendedSweep();
    }
  });

  await scheduleUnattendedSweep();

  console.log(
    `worker ready, listening on ${Object.values(QUEUES).join(", ")}`,
  );

  const shutdown = async (signal: string) => {
    console.log(`worker received ${signal}, shutting down`);
    await stopBoss();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("worker failed to start:", error);
  process.exit(1);
});
