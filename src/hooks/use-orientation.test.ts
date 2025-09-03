// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, expect, test, vi, afterEach } from 'vitest'
import { useOrientation } from './use-orientation'

type Listener = (e: any) => void
let originalAdd: any
let originalRemove: any
const originalDeviceOrientation = (globalThis as any).DeviceOrientationEvent
let listeners: Listener[] = []

afterEach(() => {
  listeners = []
  if (originalAdd) window.addEventListener = originalAdd
  if (originalRemove) window.removeEventListener = originalRemove
  ;(globalThis as any).DeviceOrientationEvent = originalDeviceOrientation
})

describe('useOrientation', () => {
  test('grants permission and updates orientation', async () => {
    originalAdd = window.addEventListener
    originalRemove = window.removeEventListener
    window.addEventListener = vi.fn((_: any, cb: any) => listeners.push(cb)) as any
    const removeSpy = vi.fn()
    window.removeEventListener = removeSpy as any
    const requestPermission = vi.fn().mockResolvedValue('granted')
    ;(globalThis as any).DeviceOrientationEvent = { requestPermission }

    const { result, unmount } = renderHook(() => useOrientation())
    await act(async () => {
      await result.current.requestPermission()
    })
    expect(result.current.permissionGranted).toBe(true)
    act(() => listeners[0]({ alpha: 1, beta: 2, gamma: 3 }))
    expect(result.current.orientation).toEqual({ alpha: 1, beta: 2, gamma: 3 })
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('deviceorientation', listeners[0])
  })

  test('handles denied permission', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied')
    ;(globalThis as any).DeviceOrientationEvent = { requestPermission }
    const addSpy = vi.fn()
    window.addEventListener = addSpy as any
    const { result } = renderHook(() => useOrientation())
    await act(async () => {
      await result.current.requestPermission()
    })
    expect(result.current.permissionGranted).toBe(false)
    expect(result.current.error).toMatch('denied')
    expect(addSpy).not.toHaveBeenCalled()
  })

  test('auto listener when permission not required', () => {
    originalAdd = window.addEventListener
    window.addEventListener = vi.fn((_: any, cb: any) => listeners.push(cb)) as any
    ;(globalThis as any).DeviceOrientationEvent = {}
    const { result } = renderHook(() => useOrientation())
    expect(window.addEventListener).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
    expect(result.current.permissionGranted).toBe(true)
  })
})
