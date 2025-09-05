/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import ReplyForm from "./reply-form";

vi.mock("./auth-provider", () => ({
  useAuth: () => ({ user: { uid: "123" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock("@/lib/pseudonym", () => ({
  getOrCreatePseudonym: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

afterEach(() => {
  cleanup();
});

describe("ReplyForm", () => {
  it("shows character count and updates as user types", () => {
    render(<ReplyForm noteId="1" />);
    const textarea = screen.getByRole("textbox");
    screen.getByText("0/120");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    screen.getByText("5/120");
  });

  it("does not exceed 120 characters", () => {
    render(<ReplyForm noteId="1" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "a".repeat(130) } });
    expect(textarea.value.length).toBe(120);
    screen.getByText("120/120");
  });
});
