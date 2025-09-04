
"use client";

import { useState } from "react";
import { useOrientation } from "./use-orientation";
import { trackEvent } from "@/lib/analytics";

export function useARMode() {
  const {
    permissionGranted: orientationGranted,
    requestPermission: requestOrientationPermission,
  } = useOrientation();
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [arError, setArError] = useState<string | null>(null);

  const permissionGranted = orientationGranted && cameraPermissionGranted;

  const requestPermission = async (): Promise<boolean> => {
    setArError(null);
    const orient = await requestOrientationPermission();
    if (!orient) {
      const errorMsg = "Motion sensor access is required for AR mode. Please enable it in your browser settings.";
      setArError(errorMsg);
      trackEvent("ar_permission_denied", { type: "orientation" });
      trackEvent("ar_launch_failed", { reason: "orientation_denied" });
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const errorMsg = "Your browser does not support the necessary camera APIs for AR mode.";
      setArError(errorMsg);
      trackEvent("ar_launch_failed", { reason: "media_devices_unsupported" });
      return false;
    }

    try {
      // Request camera access and immediately stop the stream. We only need to know if we CAN get it.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      setCameraPermissionGranted(true);
      trackEvent("ar_permission_granted");
      return true;
    } catch (err: any) {
      let errorMsg = "An unknown error occurred while trying to access the camera.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = "Camera access is required for AR mode. Please enable it in your browser settings.";
      }
      setArError(errorMsg);
      setCameraPermissionGranted(false);
      trackEvent("ar_permission_denied", { type: "camera" });
      trackEvent("ar_launch_failed", { reason: "camera_denied" });
      return false;
    }
  };

  return { permissionGranted, requestPermission, arError, setArError };
}

    