// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { useInstallPrompt } from './use-install-prompt';

describe('useInstallPrompt', () => {
  test('captures event and triggers prompt', async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
    (event as any).prompt = promptMock;
    (event as any).platforms = [];
    (event as any).userChoice = Promise.resolve({ outcome: 'accepted', platform: '' });

    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(false);
  });
});
