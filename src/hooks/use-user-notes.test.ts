// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { getDocs } from 'firebase/firestore'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('../lib/firebase', () => ({ db: {} }))

describe('useUserNotes', () => {
  test('loads notes in pages', async () => {
    ;(getDocs as any)
      .mockResolvedValueOnce({
        docs: [
          { id: '1', data: () => ({ text: 'a', createdAt: { seconds: 1, nanoseconds: 0 } }) },
          { id: '2', data: () => ({ text: 'b', createdAt: { seconds: 2, nanoseconds: 0 } }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          { id: '3', data: () => ({ text: 'c', createdAt: { seconds: 3, nanoseconds: 0 } }) },
        ],
      })

    const { useUserNotes } = await import('./use-user-notes')
    const { result } = renderHook(() => useUserNotes('user', 2))

    await act(async () => {
      await result.current.loadMore()
    })
    await waitFor(() => expect(result.current.notes).toHaveLength(2))
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })
    await waitFor(() => expect(result.current.notes).toHaveLength(3))
    expect(result.current.hasMore).toBe(false)
    expect(getDocs).toHaveBeenCalledTimes(2)
  })
})

