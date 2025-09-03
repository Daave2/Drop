// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, test, beforeEach, vi } from 'vitest'
import { useProximityNotifications } from './use-proximity-notifications'
import type { GhostNote } from '@/types'
import type { Coordinates } from './use-location'

const showNotification = vi.fn()

beforeEach(() => {
  showNotification.mockClear()
  ;(global as any).Notification = { permission: 'granted' } as any
  ;(navigator as any).serviceWorker = {
    ready: Promise.resolve({ showNotification }),
  }
})

describe('useProximityNotifications', () => {
  test('notifies when within radius', async () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: 'hi', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0, longitude: 0, accuracy: 0 }
    renderHook(() => useProximityNotifications(notes, location, 100))
    await waitFor(() => expect(showNotification).toHaveBeenCalledWith('Note nearby', { body: 'hi' }))
  })

  test('respects configurable radius', async () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: null, type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0.0015, longitude: 0, accuracy: 0 } // ~167m away
    const { rerender } = renderHook(
      ({ radius }) => useProximityNotifications(notes, location, radius),
      { initialProps: { radius: 100 } }
    )
    expect(showNotification).not.toHaveBeenCalled()
    rerender({ radius: 200 })
    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith('Note nearby', { body: 'You are near a note' })
    )
  })
})

