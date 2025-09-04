"use client";

import { useEffect, useState } from "react";
import { useOrientation } from "./use-orientation";
import { trackEvent } from "@/lib/analytics";

export function useARMode(threshold: number = 60) {
  const {
    orientation,
    permissionGranted: orientationGranted,
    requestPermission: requestOrientationPermission,
  } = useOrientation();
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [isARActive, setIsARActive] = useState(false);

  useEffect(() => {
    if (orientation.beta !== null) {
      setIsARActive(orientation.beta > threshold);
    }
  }, [orientation.beta, threshold]);

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
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionGranted(true);
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

