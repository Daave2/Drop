// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, afterEach } from 'vitest'
import { useLocation } from './use-location'

const originalGeolocation = navigator.geolocation
const originalPermissions = (navigator as any).permissions

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true })
  Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true })
})

describe('useLocation', () => {
  test('updates location and cleans up watcher', async () => {
    const mockWatch = vi.fn((success: any) => {
      success({ coords: { latitude: 1, longitude: 2, accuracy: 3, heading: 45 } })
      return 1
    })
    const mockClear = vi.fn()
    const mockPermissions = { query: vi.fn().mockResolvedValue({ state: 'granted', onchange: null }) }
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: mockWatch, clearWatch: mockClear, getCurrentPosition: vi.fn() },
      configurable: true,
    })
    Object.defineProperty(navigator, 'permissions', { value: mockPermissions, configurable: true })

    const { result, unmount } = renderHook(() => useLocation())
    await waitFor(() =>
      expect(result.current.location).toEqual({
        latitude: 1,
        longitude: 2,
        accuracy: 3,
        heading: 45,
      }),
    )
    unmount()
    expect(mockClear).toHaveBeenCalledWith(1)
  })

  test('normalizes non-finite heading to null', async () => {
    const mockWatch = vi.fn((success: any) => {
      success({ coords: { latitude: 7, longitude: 8, accuracy: 9, heading: NaN } })
      return 1
    })
    const mockPermissions = { query: vi.fn().mockResolvedValue({ state: 'granted', onchange: null }) }
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: mockWatch, clearWatch: vi.fn(), getCurrentPosition: vi.fn() },
      configurable: true,
    })
    Object.defineProperty(navigator, 'permissions', { value: mockPermissions, configurable: true })

    const { result } = renderHook(() => useLocation())
    await waitFor(() =>
      expect(result.current.location).toEqual({
        latitude: 7,
        longitude: 8,
        accuracy: 9,
        heading: null,
      }),
    )
  })

  test('handles permission denial on request', async () => {
    const error = { code: 1, message: 'Denied', PERMISSION_DENIED: 1 }
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_: any, err: any) => err(error) },
      configurable: true,
    })
    Object.defineProperty(navigator, 'permissions', {
      value: { query: vi.fn().mockResolvedValue({ state: 'prompt', onchange: null }) },
      configurable: true,
    })
    const { result } = renderHook(() => useLocation())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))
    act(() => result.current.requestPermission())
    expect(result.current.permissionState).toBe('denied')
    expect(result.current.error).toMatch('Denied')
  })

  test('falls back when Permissions API is unsupported', async () => {
    const mockWatch = vi.fn((success: any) => {
      success({ coords: { latitude: 4, longitude: 5, accuracy: 6, heading: 90 } })
      return 1
    })
    const mockClear = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: mockWatch, clearWatch: mockClear },
      configurable: true,
    })
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true })

    const { result, unmount } = renderHook(() => useLocation())
    await waitFor(() =>
      expect(result.current.location).toEqual({
        latitude: 4,
        longitude: 5,
        accuracy: 6,
        heading: 90,
      }),
    )
    expect(result.current.permissionState).toBe('granted')
    unmount()
    expect(mockWatch).toHaveBeenCalled()
    expect(mockClear).toHaveBeenCalled()
  })

  test('reports unsupported browser', () => {
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })
    const { result } = renderHook(() => useLocation())
    expect(result.current.error).toMatch(/not supported/)
    expect(result.current.permissionState).toBe('denied')
  })
})
