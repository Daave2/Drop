// @vitest-environment jsdom
import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { getBearing, ARCreateButton, SurfaceDetectionOverlay } from "./ar-view";
import { latLngToLocal, localToLatLng } from "@/lib/geo";

describe("getBearing", () => {
  test("returns 90 degrees when moving east", () => {
    const bearing = getBearing(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    );
    expect(bearing).toBeCloseTo(90);
  });

  test("returns 0 degrees when moving north", () => {
    const bearing = getBearing(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(bearing).toBeCloseTo(0);
  });
});

describe("ARCreateButton", () => {
  test("has tooltip explaining surface anchoring", () => {
    render(<ARCreateButton isCreating={false} onToggle={() => {}} />);
    const button = screen.getByRole("button", { name: /create note/i });
    expect(button.getAttribute("title")).toMatch(/surface/);
  });
});

describe("SurfaceDetectionOverlay", () => {
  test("reflects progress percent", () => {
    render(<SurfaceDetectionOverlay progress={0.5} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
  });
});

describe("world-coordinate conversions", () => {
  test("latLngToLocal and back produces original coordinates", () => {
    const origin = { lat: 10, lng: 20 };
    const target = { lat: 10.000008983, lng: 20.000008983 }; // ~1m NE
    const local = latLngToLocal(origin, target);
    const roundTrip = localToLatLng(origin, local);
    expect(roundTrip.lat).toBeCloseTo(target.lat);
    expect(roundTrip.lng).toBeCloseTo(target.lng);
  });
});
