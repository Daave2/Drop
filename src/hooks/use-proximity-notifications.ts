"use client";

import { useEffect, useRef } from "react";
import { distanceBetween } from "geofire-common";
import { useAuth } from "@/components/auth-provider";
import { GhostNote } from "@/types";
import type { Coordinates } from "./use-location";

/**
 * Dispatches a browser notification when the user enters the proximity of a note.
 *
 * @param notes - Notes to monitor for proximity.
 * @param location - Current user location; `null` when unavailable.
 * @param radiusM - Distance in meters at which a notification should fire.
 * @param cooldownMs - Minimum time between notifications to avoid spamming.
 *
 * Side Effects:
 * - Uses the Notification API (or a service worker) to show system notifications.
 * - Persists IDs of notified notes to `localStorage` for the authenticated user.
 */
export function useProximityNotifications(
  notes: GhostNote[],
  location: Coordinates | null,
  radiusM: number = 50,
  cooldownMs: number = 60000
) {
  const { user } = useAuth();
  const notifiedRef = useRef<Set<string>>(new Set()); // Persist IDs of notes already notified
  const lastNotificationRef = useRef(0); // Timestamp of last notification to enforce cooldown
  const storageKey = user ? `proximityNotified:${user.uid}` : null;

  useEffect(() => {
    if (!storageKey) {
      notifiedRef.current = new Set();
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        notifiedRef.current = new Set(JSON.parse(stored) as string[]);
      } else {
        notifiedRef.current = new Set();
      }
    } catch {
      notifiedRef.current = new Set();
    }
  }, [storageKey]);

  useEffect(() => {
    if (!location) return;
    // Only attempt to notify when the Notification API is available and permission granted
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    for (const note of notes) {
      if (notifiedRef.current.has(note.id)) continue;
      if (Date.now() - lastNotificationRef.current < cooldownMs) continue;
      const distance =
        distanceBetween(
          [location.latitude, location.longitude],
          [note.lat, note.lng]
        ) * 1000;
      if (distance <= radiusM) {
        // Prefer service worker notifications for better reliability, fallback to constructor
        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.ready.then((reg) => {
            if ("showNotification" in reg) {
              reg.showNotification("Note nearby", {
                body: note.teaser || "You are near a note",
              });
            } else {
              new Notification("Note nearby", {
                body: note.teaser || "You are near a note",
              });
            }
          });
        } else {
          new Notification("Note nearby", {
            body: note.teaser || "You are near a note",
          });
        }
        notifiedRef.current.add(note.id);
        lastNotificationRef.current = Date.now();
        if (storageKey) {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify(Array.from(notifiedRef.current))
          );
        }
      }
    }
  }, [notes, location, radiusM, cooldownMs, storageKey]);
}

