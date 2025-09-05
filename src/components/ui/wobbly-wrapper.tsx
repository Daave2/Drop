"use client"

import * as React from "react"
import { RoughNotation } from "react-rough-notation"

interface WobblyWrapperProps {
  children: React.ReactElement
  color?: string
  className?: string
}

export function WobblyWrapper({
  children,
  color = "var(--foreground)",
  className,
}: WobblyWrapperProps) {
  const canAnnotate =
    typeof window !== "undefined" &&
    typeof SVGPathElement !== "undefined" &&
    // @ts-expect-error: getTotalLength may not exist in non-browser environments
    typeof SVGPathElement.prototype.getTotalLength === "function"

  if (!canAnnotate) {
    return <span className={className ?? "inline-block"}>{children}</span>
  }

  return (
    <span className={className ?? "inline-block"}>
      <RoughNotation type="box" strokeWidth={2} padding={2} color={color} show>
        {children}
      </RoughNotation>
    </span>
  )
}
