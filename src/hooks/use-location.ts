"use client";

import { useState, useEffect } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setPermissionState('denied');
      return;
    }
    
    const permissions = (navigator as any).permissions
    // Check initial permission status if the Permissions API is supported
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
