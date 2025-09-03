// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  test('responds to matchMedia changes and cleans up', () => {
    const listeners: Array<() => void> = []
    const removeEventListener = vi.fn()
    ;(window as any).matchMedia = vi.fn().mockImplementation(() => ({
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener,
    }))

    window.innerWidth = 500
    const { result, unmount } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    window.innerWidth = 800
    act(() => listeners.forEach((fn) => fn()))
    expect(result.current).toBe(false)

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', listeners[0])
  })
})
