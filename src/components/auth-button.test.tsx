/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthButton } from "./auth-button";

const signInWithPopupMock = vi.fn();

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: (...args: any[]) => signInWithPopupMock(...args),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ auth: {} }));

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("AuthButton", () => {
  afterEach(() => {
    signInWithPopupMock.mockReset();
    cleanup();
  });

  it("disables button during sign-in and re-enables after success", async () => {
    let resolveFn: () => void = () => {};
    signInWithPopupMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        })
    );

    const { getByRole } = render(<AuthButton />);
    const button = getByRole("button") as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    resolveFn();
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  it("re-enables button after sign-in error", async () => {
    let rejectFn: (err: any) => void = () => {};
    signInWithPopupMock.mockImplementation(
      () =>
        new Promise<void>((_, reject) => {
          rejectFn = reject;
        })
    );

    const { getByRole } = render(<AuthButton />);
    const button = getByRole("button") as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    rejectFn(new Error("failed"));
    await waitFor(() => expect(button.disabled).toBe(false));
  });
});

