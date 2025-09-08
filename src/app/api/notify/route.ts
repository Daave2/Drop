import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { notifySchema } from '@/lib/validators';

if (!getApps().length) {
  initializeApp();
}

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;
const ipHits = new Map<string, { count: number; time: number }>();

function hit(ip: string) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, time: now };
  if (now - entry.time > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.time = now;
  }
  entry.count++;
  ipHits.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!hit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  if (req.headers.get('authorization') !== `Bearer ${process.env.NOTIFY_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let parsed;
  try {
    parsed = notifySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const { token, title, body } = parsed;
  try {
    await getMessaging().send({ token, notification: { title, body } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
