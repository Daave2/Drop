// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('firebase/messaging', () => ({ getToken: vi.fn(() => Promise.resolve('token-123')) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(() => Promise.resolve()),
  arrayUnion: vi.fn((v: any) => v),
}));
vi.mock('@/lib/firebase', () => ({ messaging: {}, db: {} }));
vi.mock('@/components/auth-provider', () => ({ useAuth: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useFcmToken', () => {
  test('requests permission and stores token', async () => {
    const { useAuth } = await import('@/components/auth-provider');
    (useAuth as any).mockReturnValue({ user: { uid: 'u1' } });
    (global as any).Notification = {
      requestPermission: vi.fn(() => Promise.resolve('granted')),
    };
    const { useFcmToken } = await import('./use-fcm-token');
    renderHook(() => useFcmToken());
    const { getToken } = await import('firebase/messaging');
    const { setDoc } = await import('firebase/firestore');
    await waitFor(() => expect((getToken as any)).toHaveBeenCalled());
    await waitFor(() => expect((setDoc as any)).toHaveBeenCalled());
  });
});
