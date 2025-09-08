import { describe, expect, test, vi } from 'vitest';

const { promptMock } = vi.hoisted(() => ({ promptMock: vi.fn() }));
vi.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: () => promptMock,
    defineFlow: (_cfg: unknown, handler: any) => handler,
  },
}));

import { moderateContent } from './content-moderation';

describe('moderateContent', () => {
  test('allows safe content', async () => {
    promptMock.mockResolvedValueOnce({ output: { isSafe: true, reason: '' } });
    const res = await moderateContent({ text: 'hello' });
    expect(res).toEqual({ isSafe: true, reason: '' });
  });

  test('rejects unsafe content', async () => {
    promptMock.mockResolvedValueOnce({
      output: { isSafe: false, reason: 'bad' },
    });
    const res = await moderateContent({ text: 'spam' });
    expect(res).toEqual({ isSafe: false, reason: 'bad' });
  });

  test('handles errors with 503', async () => {
    promptMock.mockRejectedValueOnce(new Error('boom'));
    await expect(moderateContent({ text: 'hi' })).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('retry'),
    });
  });
});
