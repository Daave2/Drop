// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import ARView from './ar-view'
import { describe, expect, test, vi } from 'vitest'
import { GhostNote } from '@/types'

describe('ARView', () => {
  test('shows camera feed with notes overlay', async () => {
    const stop = vi.fn()
    const mockStream = { getTracks: vi.fn(() => [{ stop }]) } as any
    const getUserMedia = vi.fn().mockResolvedValue(mockStream)
    ;(navigator.mediaDevices as any) = { getUserMedia }

    const notes: GhostNote[] = [
      {
        id: '1',
        lat: 0,
        lng: 0,
        createdAt: { seconds: 0, nanoseconds: 0 },
        type: 'text',
        teaser: 'Hello',
        score: 0,
      },
    ]

    const { container, unmount } = render(<ARView notes={notes} />)
    expect(await screen.findByText('Hello')).toBeTruthy()
    expect(getUserMedia).toHaveBeenCalled()
    const overlay = container.querySelector('.h-2\\/3')
    expect(overlay).not.toBeNull()
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    unmount()
    expect(stop).toHaveBeenCalled()
  })
})
