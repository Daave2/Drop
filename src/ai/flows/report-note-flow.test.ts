import { describe, expect, test, vi, beforeEach } from 'vitest';

const { addMock, collectionMock, getFirestoreMock } = vi.hoisted(() => {
  const addMock = vi.fn();
  const collectionMock = vi.fn(() => ({ add: addMock }));
  const getFirestoreMock = vi.fn(() => ({ collection: collectionMock }));
  return { addMock, collectionMock, getFirestoreMock };
});

vi.mock('firebase-admin/app', () => ({
  getApps: () => [],
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: getFirestoreMock,
  FieldValue: { serverTimestamp: vi.fn(() => 'timestamp') },
}));

vi.mock('@/ai/genkit', () => ({
  ai: { defineFlow: (_cfg: unknown, handler: any) => handler },
}));

import { reportNote } from './report-note-flow';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reportNote', () => {
  test('records report and returns success', async () => {
    addMock.mockResolvedValueOnce({ id: '1' });
    const res = await reportNote({
      noteId: 'note1',
      reason: 'This note is inappropriate',
      reporterUid: 'user1',
    });
    expect(res).toEqual({ success: true, message: 'Report submitted successfully.' });
    expect(collectionMock).toHaveBeenCalledWith('reports');
    expect(addMock).toHaveBeenCalledWith({
      noteId: 'note1',
      reason: 'This note is inappropriate',
      reporterUid: 'user1',
      createdAt: 'timestamp',
      status: 'pending_review',
    });
  });

  test('returns failure on invalid input', async () => {
    const res = await reportNote({
      noteId: 'note1',
      reason: 'short',
      reporterUid: 'user1',
    });
    expect(res.success).toBe(false);
    expect(addMock).not.toHaveBeenCalled();
  });
});
