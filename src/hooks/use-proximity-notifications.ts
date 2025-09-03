"use client";

import { useEffect, useRef } from "react";
import { distanceBetween } from "geofire-common";
import { GhostNote } from "@/types";
import type { Coordinates } from "./use-location";

export function useProximityNotifications(
  notes: GhostNote[],
  location: Coordinates | null,
  radiusM: number = 50
) {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!location) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    for (const note of notes) {
      if (notifiedRef.current.has(note.id)) continue;
      const distance =
        distanceBetween(
          [location.latitude, location.longitude],
          [note.lat, note.lng]
        ) * 1000;
      if (distance <= radiusM) {
        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification("Note nearby", {
              body: note.teaser || "You are near a note",
            });
          });
        } else {
          new Notification("Note nearby", {
            body: note.teaser || "You are near a note",
          });
        }
        notifiedRef.current.add(note.id);
      }
    }
  }, [notes, location, radiusM]);
}

