// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { useOnline } from "./use-online";

// Mock useToast to avoid real toasts during tests
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("useOnline", () => {
  it("updates status on offline/online events", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnline());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);
  });
});
