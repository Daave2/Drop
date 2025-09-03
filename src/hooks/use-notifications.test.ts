// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(() => ({ update: vi.fn(), commit: vi.fn() })),
  Timestamp: class { constructor(public seconds: number, public nanoseconds: number) {} },
}))

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('@/components/auth-provider', () => ({ useAuth: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useNotifications', () => {
  test('loads notifications for user', async () => {
    const { useAuth } = await import('@/components/auth-provider')
    ;(useAuth as any).mockReturnValue({ user: { uid: 'user1' } })
    let snapshotHandler: any
    const { onSnapshot } = await import('firebase/firestore')
    ;(onSnapshot as any).mockImplementation((_q: any, cb: any) => {
      snapshotHandler = cb
      return vi.fn()
    })

    const { useNotifications } = await import('./use-notifications')
    const { result } = renderHook(() => useNotifications())

    act(() => {
      snapshotHandler({
        docs: [
          {
            id: 'n1',
            data: () => ({
              userId: 'user1',
              type: 'like',
              noteId: 'note1',
              actorUid: 'u2',
              actorPseudonym: 'Bob',
              createdAt: { seconds: 1, nanoseconds: 0 },
              read: false,
            }),
          },
        ],
      })
    })

    await waitFor(() => expect(result.current.notifications).toHaveLength(1))
    expect(result.current.loading).toBe(false)
  })

  test('marks notifications as read', async () => {
    const { useAuth } = await import('@/components/auth-provider')
    ;(useAuth as any).mockReturnValue({ user: { uid: 'user1' } })
    const { writeBatch, onSnapshot } = await import('firebase/firestore')
    const batch = { update: vi.fn(), commit: vi.fn() }
    ;(writeBatch as any).mockReturnValue(batch)
    let snapshotHandler: any
    ;(onSnapshot as any).mockImplementation((_q: any, cb: any) => {
      snapshotHandler = cb
      return vi.fn()
    })

    const { useNotifications } = await import('./use-notifications')
    const { result } = renderHook(() => useNotifications())

    act(() => {
      snapshotHandler({
        docs: [
          {
            id: 'n1',
            data: () => ({
              userId: 'user1',
              type: 'like',
              noteId: 'note1',
              actorUid: 'u2',
              actorPseudonym: 'Bob',
              createdAt: { seconds: 1, nanoseconds: 0 },
              read: false,
            }),
          },
        ],
      })
    })

    await waitFor(() => expect(result.current.notifications).toHaveLength(1))
    await act(async () => {
      await result.current.markAllAsRead()
    })
    expect(batch.update).toHaveBeenCalled()
    expect(batch.commit).toHaveBeenCalled()
  })
})

