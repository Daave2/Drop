// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { GhostNote } from "@/types";

vi.mock("@/hooks/use-location", () => ({
  useLocation: () => ({
    location: { latitude: 0, longitude: 0, accuracy: 0 },
    error: null,
    permissionState: "granted",
    requestPermission: vi.fn(),
  }),
}));

const requestOrientationPermission = vi.fn();

vi.mock("@/hooks/use-orientation", () => ({
  useOrientation: () => ({
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    error: null,
    permissionGranted: true,
    requestPermission: requestOrientationPermission,
  }),
}));

import ARView from "./ar-view";

describe("ARView", () => {
  test("shows camera feed with notes overlay", async () => {
    const stop = vi.fn();
    const mockStream = { getTracks: vi.fn(() => [{ stop }]) } as any;
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    (navigator.mediaDevices as any) = { getUserMedia };

    const notes: GhostNote[] = [
      {
        id: "1",
        lat: 0,
        lng: 0,
        createdAt: { seconds: 0, nanoseconds: 0 },
        type: "text",
        teaser: "Hello",
        score: 0,
      },
    ];

    const { container, unmount } = render(<ARView notes={notes} />);
    const noteEl = await screen.findByText("Hello");
    expect(requestOrientationPermission).toHaveBeenCalled();
    expect(noteEl.style.left).toBe("50%");
    expect(getUserMedia).toHaveBeenCalled();
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
