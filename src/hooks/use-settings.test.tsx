// @vitest-environment jsdom
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, expect, test, beforeEach } from 'vitest'
import { SettingsProvider, useSettings } from './use-settings'

const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

describe('useSettings', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('uses default radius when none stored', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.proximityRadiusM).toBe(
      Number(process.env.NEXT_PUBLIC_PROXIMITY_RADIUS_M ?? 50)
    )
  })

  test('persists updated radius', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setProximityRadiusM(75))
    expect(result.current.proximityRadiusM).toBe(75)
    expect(window.localStorage.getItem('proximityRadiusM')).toBe('75')
  })

  test('loads radius from storage', () => {
    window.localStorage.setItem('proximityRadiusM', '80')
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.proximityRadiusM).toBe(80)
  })
})
