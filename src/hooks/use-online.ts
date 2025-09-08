"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Tracks the browser's online status and blocks network requests when offline.
 *
 * Returns:
 * - `isOnline`: current online status.
 * - `assertOnline`: helper that shows a toast and returns false when offline.
 */
export function useOnline() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const originalFetch = useRef<typeof fetch>();

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  useEffect(() => {
    if (!originalFetch.current) {
      originalFetch.current = globalThis.fetch;
    }
    if (isOnline) {
      globalThis.fetch = originalFetch.current;
    } else {
      globalThis.fetch = async (...args) => {
        toast({
          title: "Offline",
          description: "You're offline. Please try again when you're back online.",
        });
        return Promise.reject(new Error("offline"));
      };
    }
  }, [isOnline, toast]);

  const assertOnline = () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "You're offline. Please try again when you're back online.",
      });
      return false;
    }
    return true;
  };

  return { isOnline, assertOnline };
}
