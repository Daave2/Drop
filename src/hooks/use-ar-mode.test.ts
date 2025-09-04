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
  test('activates only after beta exceeds threshold for debounce period', () => {
    vi.useFakeTimers()
    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 30, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    const { result, rerender } = renderHook(() => useARMode(45))
    expect(result.current.isARActive).toBe(false)

    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 80, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    rerender()
    expect(result.current.isARActive).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.isARActive).toBe(false)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current.isARActive).toBe(true)
    vi.useRealTimers()
  })

  test('activates for negative beta values beyond threshold', () => {
    vi.useFakeTimers()
    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: -30, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    const { result, rerender } = renderHook(() => useARMode(45))
    expect(result.current.isARActive).toBe(false)

    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: -80, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    rerender()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isARActive).toBe(true)
    vi.useRealTimers()
  })

  test('debounces deactivation when hovering near threshold', () => {
    vi.useFakeTimers()
    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 80, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    const { result, rerender } = renderHook(() => useARMode(60, 5))
    expect(result.current.isARActive).toBe(false)

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isARActive).toBe(true)

    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 40, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    rerender()
    expect(result.current.isARActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 80, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    rerender()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isARActive).toBe(true)

    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 40, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn().mockResolvedValue(true)
    })
    rerender()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isARActive).toBe(false)
    vi.useRealTimers()
  })

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

