import Anthropic from "@anthropic-ai/sdk";

import { env } from "../env";
import type { ReplyContext } from "../reply-context";
import { buildSystemPrompt } from "./instructions";
import { extractJsonObject } from "./json";
import { buildClinicPrompt, buildMessages } from "./prompt";

/**
 * The Anthropic call. Returns the raw text; parsing and validation happen
 * downstream, because nothing the model says is trusted here.
 */

export class AiUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiUnavailableError";
  }
}

export type DraftGeneration = {
  raw: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
  };
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError("ANTHROPIC_API_KEY is not set");
  }
  client ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 2,
    timeout: 60_000,
  });
  return client;
}

const MAX_TOKENS = 1024;

export async function generateDraft(
  ctx: ReplyContext,
  opts?: { correctionNote?: string },
): Promise<DraftGeneration> {
  const anthropic = getClient();

  const system: Array<
    | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  > = [
    // Live voice only. Pending voice waits for review, same as a KB edit.
    { type: "text", text: buildSystemPrompt(ctx.clinic.voice) },
    {
      type: "text",
      text: buildClinicPrompt(ctx),
      // The clinic's knowledge base is identical on every enquiry for that
      // clinic, so it is cached. Cache reads cost a tenth of normal input.
      cache_control: { type: "ephemeral" },
    },
  ];

  const note = opts?.correctionNote?.trim();
  if (note) {
    // Not cached and not a fact. The validator still requires every sentence
    // to map to a knowledge base entry.
    system.push({
      type: "text",
      text: `# OPERATOR CORRECTION

The previous draft was wrong. Use this note as correction context only. It is not a clinic fact. Do not cite it as a source_id.

${note}`,
    });
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      system,
      messages: buildMessages(ctx),
    });
  } catch (error) {
    throw new AiUnavailableError(
      `Anthropic request failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    raw: extractJsonObject(text),
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    },
  };
}
