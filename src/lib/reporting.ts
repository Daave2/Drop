const rawThreshold = process.env.NEXT_PUBLIC_REPORT_THRESHOLD;
const parsedThreshold = Number.parseInt(rawThreshold ?? '', 10);
/** Default number of reports required before a note is hidden. */
export const REPORT_THRESHOLD = Number.isNaN(parsedThreshold) ? 3 : parsedThreshold;

/**
 * Increment a note's report count and determine if it should be hidden based on
 * the provided threshold.
 */
export function calculateReportUpdate(current: number, threshold: number = REPORT_THRESHOLD) {
  const newCount = current + 1;
  return { newCount, hide: newCount >= threshold };
}
