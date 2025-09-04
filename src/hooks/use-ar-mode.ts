"use client";

import { useEffect, useRef, useState } from "react";
import { useOrientation } from "./use-orientation";
import { trackEvent } from "@/lib/analytics";

export function useARMode(
  threshold: number = 60,
  hysteresis: number = 5,
  debounceMs: number = 250
) {
  const {
    orientation,
    permissionGranted: orientationGranted,
    requestPermission: requestOrientationPermission,
  } = useOrientation();
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const beta = orientation.beta;
    if (beta === null) return;
    const target = isARActive
      ? beta > threshold - hysteresis
      : beta > threshold;

    if (target === isARActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsARActive(target);
      timeoutRef.current = null;
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [orientation.beta, threshold, hysteresis, debounceMs, isARActive]);

  const permissionGranted = orientationGranted && cameraPermissionGranted;

  const requestPermission = async () => {
    const orient = await requestOrientationPermission();
    if (!orient) {
      trackEvent("ar_permission_denied", { type: "orientation" });
      trackEvent("ar_launch_failed", { reason: "orientation_denied" });
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      trackEvent("ar_launch_failed", { reason: "media_devices_unsupported" });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      setCameraPermissionGranted(true);
      trackEvent("ar_permission_granted");
      return true;
    } catch {
      setCameraPermissionGranted(false);
      trackEvent("ar_permission_denied", { type: "camera" });
      trackEvent("ar_launch_failed", { reason: "camera_denied" });
      return false;
    }
  };

  return { isARActive, permissionGranted, requestPermission };
}

