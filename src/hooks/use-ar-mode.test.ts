// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useARMode } from './use-ar-mode';
import { useOrientation } from './use-orientation';
import { trackEvent } from '@/lib/analytics';

vi.mock('./use-orientation');
vi.mock('@/lib/analytics');

const mockedUseOrientation = useOrientation as any;
const mockedTrackEvent = trackEvent as any;

describe('useARMode', () => {
  beforeEach(() => {
    mockedUseOrientation.mockReturnValue({
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true),
    });
  });

  afterEach(() => {
    delete (navigator as any).xr;
    delete (navigator as any).mediaDevices;
    mockedTrackEvent.mockReset();
  });

  it('sets error when WebXR is not supported', async () => {
    delete (navigator as any).xr;
    const { result } = renderHook(() => useARMode());
    let success = false;
    await act(async () => {
      success = await result.current.requestPermission();
    });
    expect(success).toBe(false);
    expect(String(result.current.arError)).toMatch(/not supported/i);
  });

  it('requests camera permission when supported', async () => {
    const stopSpy = vi.fn();
    const removeTrackSpy = vi.fn();
    const cameraSpy = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopSpy }],
      removeTrack: removeTrackSpy,
    });
    (navigator as any).xr = { isSessionSupported: vi.fn().mockResolvedValue(true) };
    (navigator as any).mediaDevices = { getUserMedia: cameraSpy };
    const { result } = renderHook(() => useARMode());
    const success = await result.current.requestPermission();
    expect(success).toBe(true);
    expect(cameraSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
    expect(removeTrackSpy).toHaveBeenCalled();
  });
});
