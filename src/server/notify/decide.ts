/**
 * Whether to actually fire a notification, or just mark the draft so a later
 * sweep does not dump a backlog when the operator turns the channel on.
 *
 * The global kill switch is not a "skip and claim" — it is a "try again
 * later", so it is not represented here.
 */
export type NotifySkip = "send" | "claim_without_sending";

export function decideQueueEmail(args: {
  notifyEmail: boolean;
  operatorEmail: string | undefined;
}): NotifySkip {
  if (!args.notifyEmail || !args.operatorEmail) return "claim_without_sending";
  return "send";
}

export type EscalateDecision = "send" | "claim_without_sending" | "defer";

export function decideEscalation(args: {
  globalKillSwitch: boolean;
  notifySms: boolean;
  operatorMobile: string | undefined;
}): EscalateDecision {
  // Claim first when the channel is off, otherwise turning it on later would
  // dump every old queue item as an SMS.
  if (!args.notifySms || !args.operatorMobile) return "claim_without_sending";
  // Do not claim. The next sweep should try again once sending is allowed.
  if (args.globalKillSwitch) return "defer";
  return "send";
}
