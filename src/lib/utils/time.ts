/**
 * Time formatting utilities.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Formats a Unix timestamp (ms) as a human-readable relative string.
 *
 * @param ms - Unix timestamp in milliseconds
 * @returns A relative time string like "just now", "5 minutes ago", etc.
 */
export function formatRelativeTime(ms: number): string {
  const delta = Date.now() - ms;

  if (delta < MINUTE) return "just now";

  if (delta < HOUR) {
    const minutes = Math.floor(delta / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (delta < DAY) {
    const hours = Math.floor(delta / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(delta / DAY);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
