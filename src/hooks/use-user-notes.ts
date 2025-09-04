
"use client";

import { useState, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Note } from "@/types";

const DEFAULT_PAGE_SIZE = 10;

export function useUserNotes(uid: string, pageSize: number = DEFAULT_PAGE_SIZE) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!db || loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const notesRef = collection(db, "notes");
      let q = query(
        notesRef,
        where("authorUid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          notesRef,
          where("authorUid", "==", uid),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const newNotes = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Note)
      );
      setNotes((prev) => [...prev, ...newNotes]);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;
      setLastDoc(lastVisible);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (error) {
      console.error("Error fetching user notes:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [uid, pageSize, lastDoc, hasMore]);

  return { notes, loading, hasMore, loadMore };
}
