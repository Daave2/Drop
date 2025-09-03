// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useARMode } from './use-ar-mode'
import { useOrientation } from './use-orientation'

vi.mock('./use-orientation')

const mockedUseOrientation = useOrientation as any

describe('useARMode', () => {
  test('activates when beta exceeds threshold', () => {
    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 30, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn()
    })
    const { result, rerender } = renderHook(() => useARMode(45))
    expect(result.current.isARActive).toBe(false)

    mockedUseOrientation.mockReturnValue({
      orientation: { alpha: 0, beta: 80, gamma: 0 },
      permissionGranted: true,
      requestPermission: vi.fn()
    })
    rerender()
    expect(result.current.isARActive).toBe(true)
  })
})

