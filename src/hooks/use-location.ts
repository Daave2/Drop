"use client";

import { useState, useEffect } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
}

/**
 * Tracks the user's geolocation and permission status.
 *
 * Returns an object with the following fields:
 * - `location`: latest coordinates or `null` if unavailable.
 * - `error`: error message when a lookup fails, otherwise `null`.
 * - `permissionState`: browser geolocation permission state.
 * - `requestPermission`: function to prompt the user for permission.
 *
 * Permission workflow: checks for Geolocation API support, uses the
 * Permissions API (when available) to monitor permission changes, and
 * starts watching position only after permission is granted.
 */
export function useLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  // Convert non-finite heading values to null for consistency
  const normalizeHeading = (heading: number | null | undefined) =>
    typeof heading === 'number' && Number.isFinite(heading) ? heading : null;

  useEffect(() => {
    if (!navigator.geolocation) {
      // Geolocation API unavailable; treat as a denied permission
      setError('Geolocation is not supported by your browser.');
      setPermissionState('denied');
      return;
    }

    const permissions = (navigator as any).permissions
    // Use Permissions API to react to permission changes when supported
    if (permissions?.query) {
      permissions.query({ name: 'geolocation' }).then((permissionStatus: PermissionStatus) => {
        setPermissionState(permissionStatus.state);
        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state);
        };
      });
    }

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: normalizeHeading(position.coords.heading),
      });
      setError(null);
      setPermissionState('granted');
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setError(`Error getting location: ${error.message}`);
      if (error.code === error.PERMISSION_DENIED) {
        setPermissionState('denied');
      }
    };

    let watchId: number | undefined;

    if (permissions?.query) {
      // Start watching only when permission is granted
      if (permissionState === 'granted') {
        watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      }
    } else {
      watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    }

    return () => {
      if (watchId) {
        // Clean up geolocation watcher on unmount or dependency change
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [permissionState]);

  const requestPermission = () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: normalizeHeading(position.coords.heading),
            });
            setError(null);
            setPermissionState('granted');
        },
        (error) => {
            setError(`Error getting location: ${error.message}`);
            if(error.code === error.PERMISSION_DENIED) {
                setPermissionState('denied');
            }
        }
    );
  };

  return { location, error, permissionState, requestPermission };
}
