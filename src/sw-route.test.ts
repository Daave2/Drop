import { describe, it, expect } from 'vitest';
import { GET } from './app/sw.js/route';


describe('sw.js route', () => {
  it('serves service worker script', async () => {
    const res = await GET();
    const text = await res.text();
    expect(res.headers.get('Content-Type')).toBe('application/javascript');
    expect(text).toContain('NoteDrop Service Worker');
  });
});
