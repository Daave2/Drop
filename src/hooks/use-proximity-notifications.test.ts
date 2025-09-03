// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, test, beforeEach, vi } from 'vitest'
import { useProximityNotifications } from './use-proximity-notifications'
import type { GhostNote } from '@/types'
import type { Coordinates } from './use-location'

const notify = vi.fn()

beforeEach(() => {
  notify.mockClear()
  ;(global as any).Notification = vi.fn(function (this: any, title: string, options?: any) {
    notify(title, options)
  }) as any
  ;(global as any).Notification.permission = 'granted'
})

describe('useProximityNotifications', () => {
  test('notifies when within radius', () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: 'hi', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0, longitude: 0, accuracy: 0 }
    renderHook(() => useProximityNotifications(notes, location, 100))
    expect(notify).toHaveBeenCalledWith('Note nearby', { body: 'hi' })
  })

  test('respects configurable radius', () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: null, type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0.0015, longitude: 0, accuracy: 0 } // ~167m away
    const { rerender } = renderHook(
      ({ radius }) => useProximityNotifications(notes, location, radius),
      { initialProps: { radius: 100 } }
    )
    expect(notify).not.toHaveBeenCalled()
    rerender({ radius: 200 })
    expect(notify).toHaveBeenCalledWith('Note nearby', { body: 'You are near a note' })
  })
})

