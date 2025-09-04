const rawThreshold = process.env.NEXT_PUBLIC_REPORT_THRESHOLD;
const parsedThreshold = Number.parseInt(rawThreshold ?? '', 10);
export const REPORT_THRESHOLD = Number.isNaN(parsedThreshold) ? 3 : parsedThreshold;

export function calculateReportUpdate(current: number, threshold: number = REPORT_THRESHOLD) {
  const newCount = current + 1;
  return { newCount, hide: newCount >= threshold };
}
