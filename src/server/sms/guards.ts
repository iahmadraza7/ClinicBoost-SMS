import { segmentCount } from "@/lib/segments";
import { findBlockedTerms } from "../validation/blocked-terms";
import type { FailureCode } from "../validation/codes";

/**
 * The last checks before an SMS leaves.
 *
 * These duplicate part of the validator on purpose. The validator runs when the
 * draft is written; this runs when it is actually sent, and the two can be
 * minutes or hours apart. In between, the operator can edit the text, the
 * contact can opt out, and the kill switch can go on. Whatever was true at
 * drafting time is not what governs the send.
 *
 * The operator's edited text has never been near the validator at all, so this
 * is the only thing standing between a hand-typed reply and a Schedule 4 term
 * going out under the clinic's name.
 */

export type SendBlock = { code: FailureCode; detail: string };

export function checkSendable(args: {
  body: string;
  clinicSlug: string;
  killSwitch: boolean;
  globalKillSwitch: boolean;
  contactOptedOut: boolean;
  blockedTerms: { term: string; reason: string }[];
  maxSegments: number;
}): SendBlock[] {
  const blocks: SendBlock[] = [];

  for (const hit of findBlockedTerms(args.body, args.blockedTerms)) {
    blocks.push({
      code: "BLOCKED_TERM",
      detail: `"${hit.term}" cannot be sent (${hit.reason})`,
    });
  }

  if (args.contactOptedOut) {
    blocks.push({
      code: "CONTACT_OPTED_OUT",
      detail: "this contact has opted out of messages from this clinic",
    });
  }

  if (args.killSwitch || args.globalKillSwitch) {
    blocks.push({
      code: "KILL_SWITCH",
      detail: args.killSwitch
        ? `the kill switch is on for ${args.clinicSlug}`
        : "the global kill switch is on",
    });
  }

  const segments = segmentCount(args.body);
  if (segments > args.maxSegments) {
    blocks.push({
      code: "SEGMENTS_EXCEEDED",
      detail: `${segments} segments, cap is ${args.maxSegments}`,
    });
  }

  return blocks;
}

export function describeBlocks(blocks: SendBlock[]): string {
  return blocks.map((b) => b.detail).join("; ");
}
