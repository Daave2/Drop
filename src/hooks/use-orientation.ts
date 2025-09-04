
"use client";

import { useState, useEffect } from 'react';

export interface Orientation {
  alpha: number | null; // z-axis (compass heading)
  beta: number | null;  // x-axis (front-to-back tilt)
  gamma: number | null; // y-axis (left-to-right tilt)
}

const TEST_MODE_KEY = 'note-drop-test-orientation';

export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>({ alpha: null, beta: null, gamma: null });
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    setOrientation({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          setPermissionGranted(true);
          return true;
        } else {
          setError('Permission for device orientation was denied.');
          setPermissionGranted(false);
          return false;
        }
      } catch (err) {
        setError('Error requesting device orientation permission.');
        setPermissionGranted(false);
        return false;
      }
    } else {
      // For non-iOS 13+ browsers
      window.addEventListener('deviceorientation', handleOrientation);
      setPermissionGranted(true);
      return true;
    }
  };

  useEffect(() => {
    // Check for test mode values in local storage
    try {
      const testData = localStorage.getItem(TEST_MODE_KEY);
      if (testData) {
        const parsed = JSON.parse(testData);
        if (parsed.enabled) {
          setOrientation({
            alpha: parsed.alpha,
            beta: parsed.beta,
            gamma: parsed.gamma,
          });
          setPermissionGranted(true); // Assume granted for test mode
          return; // Don't attach real listeners
        }
      }
    } catch (e) {
      console.warn('Could not read test orientation data', e);
    }
    
    // Automatically try to add listener for browsers not requiring explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        window.addEventListener('deviceorientation', handleOrientation);
        setPermissionGranted(true);
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return { orientation, error, permissionGranted, requestPermission };
}
