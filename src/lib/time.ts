/**
 * Times are formatted on the server, in Sydney, and passed down as strings.
 *
 * Containers run in UTC and the operator's browser runs in local time, so
 * letting both format the same Date produces different text and React reports a
 * hydration mismatch. Sydney is also simply the right answer: the operator and
 * every clinic are in Australia.
 */
const SYDNEY = "Australia/Sydney";

export function formatSydneyTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatSydneyDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
