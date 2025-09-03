import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  initializeApp();
}

export async function POST(req: NextRequest) {
  const { userId, title, body, data } = await req.json();
  const db = getFirestore();
  const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
  const tokens = tokenDoc.exists ? tokenDoc.data()?.tokens || [] : [];
  if (!tokens.length) {
    return NextResponse.json({ success: false, error: 'No tokens' }, { status: 404 });
  }
  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: data || {},
  });
  return NextResponse.json({ success: true });
}
