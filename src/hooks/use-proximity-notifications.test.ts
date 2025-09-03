// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, test, beforeEach, vi } from 'vitest'
import { useProximityNotifications } from './use-proximity-notifications'
import type { GhostNote } from '@/types'
import type { Coordinates } from './use-location'

vi.mock('@/components/auth-provider', () => ({ useAuth: vi.fn() }))
import { useAuth } from '@/components/auth-provider'

const showNotification = vi.fn()

beforeEach(() => {
  showNotification.mockClear()
  window.localStorage.clear()
  ;(global as any).Notification = { permission: 'granted' } as any
  ;(navigator as any).serviceWorker = {
    ready: Promise.resolve({ showNotification }),
  }
  ;(useAuth as any).mockReturnValue({ user: { uid: 'user1' } })
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

  test('rate limits notifications to avoid spam', async () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: 'first', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
      { id: '2', lat: 0, lng: 0, teaser: 'second', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0, longitude: 0, accuracy: 0 }
    renderHook(() => useProximityNotifications(notes, location, 100, 1000))
    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1))
  })

  test('falls back to Notification API when service worker lacks showNotification', async () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: 'hi', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0, longitude: 0, accuracy: 0 }
    const notificationSpy = vi.fn()
    ;(notificationSpy as any).permission = 'granted'
    ;(global as any).Notification = notificationSpy
    ;(navigator as any).serviceWorker.ready = Promise.resolve({})
    renderHook(() => useProximityNotifications(notes, location, 100))
    await waitFor(() =>
      expect(notificationSpy).toHaveBeenCalledWith('Note nearby', { body: 'hi' })
    )
    expect(showNotification).not.toHaveBeenCalled()
  })

  test('each note triggers only once per user', async () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: 'hi', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0, longitude: 0, accuracy: 0 }
    const { unmount } = renderHook(() => useProximityNotifications(notes, location, 100))
    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1))
    unmount()
    showNotification.mockClear()
    renderHook(() => useProximityNotifications(notes, location, 100))
    await new Promise((r) => setTimeout(r, 0))
    expect(showNotification).not.toHaveBeenCalled()
  })

  test('different users can trigger the same note', async () => {
    const notes: GhostNote[] = [
      { id: '1', lat: 0, lng: 0, teaser: 'hi', type: 'text', score: 0, createdAt: { seconds: 0, nanoseconds: 0 } },
    ]
    const location: Coordinates = { latitude: 0, longitude: 0, accuracy: 0 }
    const { unmount } = renderHook(() => useProximityNotifications(notes, location, 100))
    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1))
    unmount()
    showNotification.mockClear()
    ;(useAuth as any).mockReturnValue({ user: { uid: 'user2' } })
    renderHook(() => useProximityNotifications(notes, location, 100))
    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1))
  })
})

