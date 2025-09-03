import { describe, expect, test } from "vitest";
import { latLngToLocal, localToLatLng } from "./geo";

describe("latLngToLocal", () => {
  test("returns zero vector at origin", () => {
    const v = latLngToLocal({ lat: 0, lng: 0 }, { lat: 0, lng: 0 });
    expect(v.x).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  test("eastward movement produces positive x", () => {
    const v = latLngToLocal(
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.000008983 }, // ≈1m east
    );
    expect(v.x).toBeGreaterThan(0);
  });

  test("northward movement produces negative z", () => {
    const v = latLngToLocal(
      { lat: 0, lng: 0 },
      { lat: 0.000008983, lng: 0 }, // ≈1m north
    );
    expect(v.z).toBeLessThan(0);
  });
});

describe("localToLatLng", () => {
  test("is inverse of latLngToLocal", () => {
    const origin = { lat: 0, lng: 0 };
    const target = { lat: 0.000008983, lng: 0.000008983 }; // ≈1m north-east
    const local = latLngToLocal(origin, target);
    const result = localToLatLng(origin, local);
    expect(result.lat).toBeCloseTo(target.lat);
    expect(result.lng).toBeCloseTo(target.lng);
  });
});

