"use client";

import { useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
  Timestamp,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  where,
} from "firebase/firestore";
import { geohashQueryBounds, distanceBetween } from "geofire-common";
import { db } from "../lib/firebase";
import { GhostNote } from "@/types";

const RADIUS_M = 5000;
const MAX_NOTES = 50;

export function useNotes() {
  const [notes, setNotes] = useState<GhostNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async (center: [number, number]) => {
    if (!db) return;
    setLoading(true);

    const bounds = geohashQueryBounds(center, RADIUS_M);

    const promises = bounds.map((b: [string, string]) =>
      getDocs(
        query(
          collection(db, "notes"),
          where("visibility", "==", "public"),
          orderBy("geohash"),
          startAt(b[0]),
          endAt(b[1]),
          limit(MAX_NOTES)
        )
      )
    );

    try {
      const snapshots: QuerySnapshot<DocumentData>[] = await Promise.all(promises);
      const notesData: GhostNote[] = [];
      const seen = new Set<string>();

      snapshots.forEach((snap: QuerySnapshot<DocumentData>) => {
        snap.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          if (seen.has(doc.id)) return;
          const data = doc.data();
          const distanceInKm = distanceBetween([data.lat, data.lng], center);
          if (distanceInKm * 1000 <= RADIUS_M) {
            seen.add(doc.id);
            const createdAtTimestamp = data.createdAt as Timestamp | null;
            notesData.push({
              id: doc.id,
              lat: data.lat,
              lng: data.lng,
              teaser: data.teaser,
              type: data.type,
              score: data.score,
              createdAt: createdAtTimestamp
                ? {
                    seconds: createdAtTimestamp.seconds,
                    nanoseconds: createdAtTimestamp.nanoseconds,
                  }
                : { seconds: Date.now() / 1000, nanoseconds: 0 },
            });
          }
        });
      });

      setNotes(notesData.slice(0, MAX_NOTES));
    } catch (error) {
      console.error("Error fetching notes: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { notes, loading, fetchNotes };
}

