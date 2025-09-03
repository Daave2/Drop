"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Notification } from "@/types";
import { Timestamp } from "firebase/firestore";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const createdAt = data.createdAt instanceof Timestamp
          ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
          : { seconds: Date.now() / 1000, nanoseconds: 0 };
        return { id: docSnap.id, ...data, createdAt } as Notification;
      });
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  }, [notifications, user]);

  return { notifications, loading, markAllAsRead };
}

