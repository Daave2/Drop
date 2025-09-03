import { describe, expect, test, vi, beforeEach } from 'vitest';

const { setMock, updateMock, getFirestoreMock, collectionMock } = vi.hoisted(() => {
  const setMock = vi.fn();
  const updateMock = vi.fn();
  const getMock = vi.fn(async () => ({ data: () => ({ reportCount: 0 }) }));
  const runTransactionMock = vi.fn(async (cb: any) => cb({ get: getMock, set: setMock, update: updateMock }));
  const docMock = vi.fn(() => ({}));
  const collectionMock = vi.fn(() => ({ doc: docMock }));
  const getFirestoreMock = vi.fn(() => ({ collection: collectionMock, runTransaction: runTransactionMock }));
  return { setMock, updateMock, getFirestoreMock, collectionMock };
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
    const res = await reportNote({
      noteId: 'note1',
      reason: 'This note is inappropriate',
      reporterUid: 'user1',
    });
    expect(res).toEqual({ success: true, message: 'Report submitted successfully.' });
    expect(collectionMock).toHaveBeenCalledWith('reports');
    expect(setMock).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      noteId: 'note1',
      reason: 'This note is inappropriate',
      reporterUid: 'user1',
      createdAt: 'timestamp',
      status: 'pending_review',
    }));
    expect(updateMock).toHaveBeenCalled();
  });

  test('returns failure on invalid input', async () => {
    const res = await reportNote({
      noteId: 'note1',
      reason: 'short',
      reporterUid: 'user1',
    });
    expect(res.success).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });
});
