const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = hits.get(key) ?? [];
  const recent = arr.filter(ts => now - ts < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}

export function resetRateLimits() {
  hits.clear();
}
