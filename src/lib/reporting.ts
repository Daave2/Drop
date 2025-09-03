export const REPORT_THRESHOLD = Number(process.env.NEXT_PUBLIC_REPORT_THRESHOLD ?? 3);

export function calculateReportUpdate(current: number, threshold: number = REPORT_THRESHOLD) {
  const newCount = current + 1;
  return { newCount, hide: newCount >= threshold };
}
