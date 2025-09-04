/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NdIcon } from "./nd-icon";

describe("NdIcon", () => {
  it("references the correct symbol", () => {
    const { container } = render(<NdIcon name="camera" />);
    const use = container.querySelector("use");
    expect(use?.getAttribute("href")).toBe("#nd-camera");
  });
});

