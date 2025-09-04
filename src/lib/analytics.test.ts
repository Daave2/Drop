import { describe, expect, test, vi, beforeEach } from 'vitest';
import { trackEvent } from './analytics';

vi.mock('./firebase', () => ({ app: {}, isFirebaseConfigured: true }));
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
}));

import { getAnalytics, logEvent } from 'firebase/analytics';

beforeEach(() => {
  (globalThis as any).window = {};
  vi.clearAllMocks();
});

describe('trackEvent', () => {
  test('logs events when firebase configured', () => {
    trackEvent('test_event', { foo: 'bar' });
    expect(getAnalytics).toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith({}, 'test_event', { foo: 'bar' });
  });

  test('does nothing when window undefined', () => {
    const orig = globalThis.window;
    // @ts-ignore
    delete (globalThis as any).window;
    trackEvent('no_window');
    expect(logEvent).not.toHaveBeenCalled();
    globalThis.window = orig;
  });
});
