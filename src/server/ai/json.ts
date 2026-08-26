/**
 * Finds the JSON object in a model response.
 *
 * The contract says one JSON object and nothing else, and the model usually
 * obeys. When it does not, what it produces is the right object with something
 * around it: a markdown fence, or a sentence of preamble, or both. That is the
 * difference between a usable draft and a SCHEMA_INVALID an operator has to
 * rewrite by hand, so it is worth unwrapping.
 *
 * This only ever narrows the text to a candidate. It does not repair JSON, and
 * whatever comes out is still parsed strictly and still trusted no further than
 * any other model output.
 */
export function extractJsonObject(text: string): string {
  const trimmed = text.trim();

  const fenced = lastFencedBlock(trimmed);
  if (fenced !== null) return fenced;

  // Prose either side of a bare object, e.g. "Here you go: { ... }".
  if (!trimmed.startsWith("{")) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

/**
 * The last block rather than the first: when a model produces more than one, it
 * is correcting itself as it goes, and the final one is the answer.
 */
function lastFencedBlock(text: string): string | null {
  const closing = text.lastIndexOf("```");
  if (closing === -1) return null;

  const opening = text.lastIndexOf("```", closing - 1);
  if (opening === -1) return null;

  const firstNewline = text.indexOf("\n", opening);
  if (firstNewline === -1 || firstNewline > closing) return null;

  return text.slice(firstNewline + 1, closing).trim();
}
