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
import { LruCache } from "../lib/cache";
import { GhostNote } from "@/types";

/** Search radius in meters for nearby notes. */
const RADIUS_M = 5000;
/** Maximum number of notes to return to limit Firestore reads. */
const MAX_NOTES = 50;
const CACHE_TTL_MS = 30_000;
const CACHE = new LruCache<GhostNote[]>(CACHE_TTL_MS);

/**
 * Hook that fetches nearby public Ghost notes from Firestore based on a
 * geographic center. It exposes loading, error and data state along with a
 * `fetchNotes` function that triggers the query.
 */
export function useNotes() {
  const [notes, setNotes] = useState<GhostNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchNotes = useCallback(async (center: [number, number]) => {
    if (!db) return;

    // Generate geohash bounds around the provided center point. Each bound
    // corresponds to a Firestore query that is later merged. We use these
    // bounds plus the current zoom (if available) as the cache key.
    const bounds = geohashQueryBounds(center, RADIUS_M);
    const zoom = Math.round((window as any)?.mapZoom ?? 0);
    const cacheKey = `${bounds.map((b: [string, string]) => b.join("")).join("|")}:${zoom}`;
    const cached = CACHE.get(cacheKey);
    if (cached) {
      if (process.env.NODE_ENV === "development") {
        console.log("useNotes cache hit", cacheKey);
      }
      setNotes(cached);
      setError(null);
      setHasFetched(true);
      return;
    }

    setLoading(true);

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

      const finalNotes = notesData.slice(0, MAX_NOTES);
      CACHE.set(cacheKey, finalNotes);
      setNotes(finalNotes);
      setError(null);
    } catch (err) {
      console.error("Error fetching notes: ", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, []);

  return { notes, loading, fetchNotes, error, hasFetched };
}

