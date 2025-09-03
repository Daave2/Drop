import { describe, expect, it } from 'vitest';
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
