import * as THREE from "three";

const EARTH_RADIUS = 6378137; // in meters

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Convert latitude/longitude pairs to local Cartesian coordinates relative to an origin.
 * The returned vector uses meters in the X (east) and Z (south) axes.
 */
export function latLngToLocal(origin: LatLng, target: LatLng): THREE.Vector3 {
  const dLat = THREE.MathUtils.degToRad(target.lat - origin.lat);
  const dLon = THREE.MathUtils.degToRad(target.lng - origin.lng);
  const x = dLon * EARTH_RADIUS * Math.cos(THREE.MathUtils.degToRad(origin.lat));
  const z = -dLat * EARTH_RADIUS;
  return new THREE.Vector3(x, 0, z);
}

