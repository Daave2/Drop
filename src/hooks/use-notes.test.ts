// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
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
  })
})

