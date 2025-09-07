import * as React from "react"

/** Maximum width in pixels before the layout is considered "mobile". */
const MOBILE_BREAKPOINT = 768

/**
 * Hook that returns `true` when the window width is below the mobile breakpoint.
 * Useful for conditionally rendering mobile specific UI or behavior.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Listen for viewport width changes via a media query.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
