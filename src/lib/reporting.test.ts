import { describe, expect, it, vi, afterEach } from 'vitest';
import { calculateReportUpdate } from './reporting';

describe('calculateReportUpdate', () => {
  it('increments count without hiding below threshold', () => {
    const res = calculateReportUpdate(1, 3);
    expect(res).toEqual({ newCount: 2, hide: false });
  });

  it('hides when threshold reached', () => {
    const res = calculateReportUpdate(2, 3);
    expect(res).toEqual({ newCount: 3, hide: true });
  });
});

describe('REPORT_THRESHOLD', () => {
  const original = process.env.NEXT_PUBLIC_REPORT_THRESHOLD;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_REPORT_THRESHOLD;
    } else {
      process.env.NEXT_PUBLIC_REPORT_THRESHOLD = original;
    }
    vi.resetModules();
  });

  it('defaults to 3 when env var missing', async () => {
    delete process.env.NEXT_PUBLIC_REPORT_THRESHOLD;
    const { REPORT_THRESHOLD } = await import('./reporting');
    expect(REPORT_THRESHOLD).toBe(3);
  });

  it('parses env var when valid', async () => {
    process.env.NEXT_PUBLIC_REPORT_THRESHOLD = '5';
    const { REPORT_THRESHOLD } = await import('./reporting');
    expect(REPORT_THRESHOLD).toBe(5);
  });

  it('falls back to 3 on invalid value', async () => {
    process.env.NEXT_PUBLIC_REPORT_THRESHOLD = 'foo';
    const { REPORT_THRESHOLD } = await import('./reporting');
    expect(REPORT_THRESHOLD).toBe(3);
  });
});
