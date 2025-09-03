// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, expect, test } from 'vitest';
import { ReportsTab } from './page';

vi.mock('@/lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => {
  const mockReports = [
    {
      id: '1',
      data: () => ({
        status: 'pending_review',
        reason: 'Pending reason',
        createdAt: { toDate: () => new Date('2023-01-02') },
        noteId: 'note1',
        reporterUid: 'user1'
      })
    },
    {
      id: '2',
      data: () => ({
        status: 'resolved',
        reason: 'Resolved reason',
        createdAt: { toDate: () => new Date('2023-01-01') },
        noteId: 'note2',
        reporterUid: 'user2'
      })
    }
  ];

  return {
    collection: vi.fn(),
    query: vi.fn((colRef: any, ...constraints: any[]) => ({ colRef, constraints })),
    where: (...args: any[]) => ({ type: 'where', args }),
    orderBy: (...args: any[]) => ({ type: 'orderBy', args }),
    getDocs: vi.fn(async (q: any) => {
      const hasPending = q.constraints.some((c: any) => c.type === 'where' && c.args[0] === 'status' && c.args[2] === 'pending_review');
      const docs = hasPending ? mockReports.filter(d => d.data().status === 'pending_review') : mockReports;
      return { docs } as any;
    }),
    doc: vi.fn(),
    getDoc: vi.fn(async () => ({
      exists: () => true,
      id: 'note1',
      data: () => ({
        text: 'Sample note',
        score: 0,
        authorUid: 'author',
        authorPseudonym: 'Author',
        createdAt: { seconds: 0 },
        media: []
      })
    })),
    writeBatch: vi.fn(() => ({ delete: vi.fn(), update: vi.fn(), commit: vi.fn() })),
    Timestamp: { },
    updateDoc: vi.fn(),
    deleteDoc: vi.fn()
  };
});

test('renders only pending reports', async () => {
  render(<ReportsTab />);

  await waitFor(() => {
    expect(screen.getByText('Pending reason')).toBeTruthy();
  });

  expect(screen.queryByText('Resolved reason')).toBeNull();
});

