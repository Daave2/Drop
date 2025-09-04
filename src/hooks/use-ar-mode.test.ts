// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useARMode } from './use-ar-mode'
import { useOrientation } from './use-orientation'
import { trackEvent } from '@/lib/analytics'

vi.mock('./use-orientation')
vi.mock('@/lib/analytics')

const mockedUseOrientation = useOrientation as any
const mockedTrackEvent = trackEvent as any

describe('useARMode', () => {
  test('requests camera permission', async () => {
    const stopSpy = vi.fn()
    const removeTrackSpy = vi.fn()
    const cameraSpy = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopSpy }],
      removeTrack: removeTrackSpy
    })
    ;(navigator as any).mediaDevices = { getUserMedia: cameraSpy }
    let granted = false
    mockedUseOrientation.mockImplementation(() => ({
      orientation: { alpha: 0, beta: 0, gamma: 0 },
      permissionGranted: granted,
      requestPermission: vi.fn().mockImplementation(() => {
        granted = true
        return Promise.resolve(true)
      })
    }))
    const { result, rerender } = renderHook(() => useARMode())
    await result.current.requestPermission()
    rerender()
    expect(cameraSpy).toHaveBeenCalled()
    expect(stopSpy).toHaveBeenCalled()
    expect(removeTrackSpy).toHaveBeenCalled()
    expect(mockedTrackEvent).toHaveBeenCalledWith('ar_permission_granted')
    expect(result.current.permissionGranted).toBe(true)
  })
})

