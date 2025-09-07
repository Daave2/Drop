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

// Default search radius in meters
const RADIUS_M = 5000;
// Maximum number of notes fetched per request
const MAX_NOTES = 50;

/**
 * Retrieves public notes near a given coordinate.
 *
 * Geohash query bounds are generated around the center point and each range is
 * queried in Firestore. Results from overlapping ranges are deduplicated by
 * document ID before being filtered to the desired radius.
 *
 * @returns Object containing:
 * - `notes`: list of nearby notes
 * - `loading`: whether a fetch is in progress
 * - `fetchNotes`: function to trigger the geolocation query
 * - `error`: error message if the fetch fails
 * - `hasFetched`: whether a fetch has been attempted
 */
export function useNotes() {
  const [notes, setNotes] = useState<GhostNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchNotes = useCallback(async (center: [number, number]) => {
    if (!db) return;
    setLoading(true);

    const bounds = geohashQueryBounds(center, RADIUS_M); // Geohash ranges covering the search radius

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
      const seen = new Set<string>(); // Track processed IDs to remove duplicates

      snapshots.forEach((snap: QuerySnapshot<DocumentData>) => {
        snap.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          if (seen.has(doc.id)) return; // Skip notes already seen in other ranges
          const data = doc.data();
          const distanceInKm = distanceBetween([data.lat, data.lng], center);
          if (distanceInKm * 1000 <= RADIUS_M) {
            seen.add(doc.id); // Mark this note as processed
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

