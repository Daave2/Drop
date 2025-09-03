"use client";

import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';

export function useFcmToken() {
  const { user } = useAuth();

  useEffect(() => {
    async function updateToken() {
      if (!user || !messaging || !db) return;
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
        });
        if (!token) return;
        await setDoc(
          doc(db, 'fcmTokens', user.uid),
          { tokens: arrayUnion(token) },
          { merge: true }
        );
      } catch (err) {
        console.error('Unable to get FCM token', err);
      }
    }

    updateToken();
  }, [user]);
}
