import { termPattern } from "./text";

/**
 * Zero tolerance. Used on model output by the validator and on knowledge base
 * bodies when the operator saves an entry, so a Schedule 4 name cannot get in
 * through the back door and then be cited as a legitimate source.
 */
export function findBlockedTerms(
  text: string,
  terms: { term: string; reason: string }[],
): { term: string; reason: string }[] {
  return terms.filter(({ term }) => termPattern(term).test(text));
}
