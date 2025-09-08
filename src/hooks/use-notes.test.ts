// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { getDocs } from 'firebase/firestore'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  startAt: vi.fn(),
  endAt: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('geofire-common', () => ({
  geohashQueryBounds: vi.fn(() => [['a', 'b']]),
  distanceBetween: vi.fn(() => 0),
}))

vi.mock('../lib/firebase', () => ({ db: {} }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('useNotes', () => {
  test('fetches and sets notes', async () => {
    ;(getDocs as any).mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({ lat: 1, lng: 2, teaser: 't', type: 'text', score: 1, createdAt: null }),
        },
      ],
    })
    const { useNotes } = await import('./use-notes')
    const { result } = renderHook(() => useNotes())
    await act(async () => {
      await result.current.fetchNotes([0, 0])
    })
    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    expect(getDocs).toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasFetched).toBe(true)
  })

  test('propagates fetch errors', async () => {
    ;(getDocs as any).mockRejectedValue(new Error('boom'))
    const { useNotes } = await import('./use-notes')
    const { result } = renderHook(() => useNotes())
    await act(async () => {
      await result.current.fetchNotes([0, 0])
    })
    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.loading).toBe(false)
    expect(result.current.hasFetched).toBe(true)
  })

  test('clears error after successful fetch', async () => {
    ;(getDocs as any)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({
        docs: [
          {
            id: '1',
            data: () => ({ lat: 1, lng: 2, teaser: 't', type: 'text', score: 1, createdAt: null }),
          },
        ],
      })

    const { useNotes } = await import('./use-notes')
    const { result } = renderHook(() => useNotes())

    await act(async () => {
      await result.current.fetchNotes([0, 0])
    })
    await waitFor(() => expect(result.current.error).toBe('fail'))
    expect(result.current.hasFetched).toBe(true)

    await act(async () => {
      await result.current.fetchNotes([0, 0])
    })
    await waitFor(() => expect(result.current.error).toBeNull())
    expect(result.current.notes).toHaveLength(1)
  })

  test('returns cached notes within ttl', async () => {
    ;(getDocs as any).mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({ lat: 1, lng: 2, teaser: 't', type: 'text', score: 1, createdAt: null }),
        },
      ],
    })
    const { useNotes } = await import('./use-notes')
    const { result } = renderHook(() => useNotes())

    await act(async () => {
      await result.current.fetchNotes([0, 0])
    })
    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    expect(getDocs).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.fetchNotes([0, 0])
    })
    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    expect(getDocs).toHaveBeenCalledTimes(1)
  })
})

