import { describe, expect, test, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

const sendMock = vi.fn();
const sendMultiMock = vi.fn();
const getDocMock = vi.fn();
vi.mock('firebase-admin/app', () => ({ getApps: () => [], initializeApp: vi.fn() }));
vi.mock('firebase-admin/messaging', () => ({
  getMessaging: () => ({ send: sendMock, sendEachForMulticast: sendMultiMock }),
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({ doc: () => ({ get: getDocMock }) }),
  }),
}));

function makeReq(body: any, headers: Record<string, string>) {
  return new NextRequest('http://localhost/api/notify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  });
}

beforeEach(() => {
  sendMock.mockReset();
  sendMultiMock.mockReset();
  getDocMock.mockResolvedValue({ exists: true, data: () => ({ tokens: ['t'] }) });
  process.env.NOTIFY_SECRET = 'secret';
});

describe('notify route', () => {
  test('sends notification with token', async () => {
    const req = makeReq(
      { token: 't', title: 'hi', body: 'there' },
      { authorization: 'Bearer secret', 'x-forwarded-for': '1.1.1.1' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalled();
  });

  test('sends notification by userId', async () => {
    const req = makeReq(
      { userId: 'u', title: 'hi', body: 'b' },
      { 'x-forwarded-for': '3.3.3.3' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendMultiMock).toHaveBeenCalled();
  });

  test('rejects invalid payload', async () => {
    const req = makeReq(
      { token: 't', title: 'hi' },
      { authorization: 'Bearer secret', 'x-forwarded-for': '1.1.1.1' }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('unauthorized request', async () => {
    const req = makeReq(
      { token: 't', title: 'hi', body: 'b' },
      { 'x-forwarded-for': '1.1.1.1' }
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('rate limits requests', async () => {
    const headers = { authorization: 'Bearer secret', 'x-forwarded-for': '2.2.2.2' };
    const body = { token: 't', title: 'hi', body: 'b' };
    for (let i = 0; i < 30; i++) {
      await POST(makeReq(body, headers));
    }
    const res = await POST(makeReq(body, headers));
    expect(res.status).toBe(429);
  });
});
