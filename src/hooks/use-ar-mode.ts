"use client";

import { useState } from "react";
import { useOrientation } from "./use-orientation";

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
    if (!navigator.xr?.isSessionSupported) {
      const errorMsg = "AR mode is not supported on this device or browser.";
      setArError(errorMsg);
      return false;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        const errorMsg = "AR mode is not supported on this device or browser.";
        setArError(errorMsg);
        return false;
      }
    } catch {
      const errorMsg = "Unable to verify AR support on this device.";
      setArError(errorMsg);
      return false;
    }

    const orient = await requestOrientationPermission();
    if (!orient) {
      const errorMsg = "Motion sensor access is required for AR mode. Please enable it in your browser settings.";
      setArError(errorMsg);
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const errorMsg = "Your browser does not support the necessary camera APIs for AR mode.";
      setArError(errorMsg);
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
      return true;
    } catch (err: any) {
      let errorMsg = "An unknown error occurred while trying to access the camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera access is required for AR mode. Please enable it in your browser settings.";
      }
      setArError(errorMsg);
      setCameraPermissionGranted(false);
      return false;
    }
  };

  return { permissionGranted, requestPermission, arError, setArError };
}

    