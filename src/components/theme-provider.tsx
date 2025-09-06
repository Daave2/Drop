"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

interface ThemeProviderProps {
  children: React.ReactNode
  [key: string]: any
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeWatcher>{children}</ThemeWatcher>
    </NextThemesProvider>
  )
}

function ThemeWatcher({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  React.useEffect(() => {
    const html = document.documentElement
    if (theme === "sketch") {
      html.setAttribute("data-theme", "sketch")
    } else {
      html.removeAttribute("data-theme")
    }
  }, [theme])

  return <>{children}</>
}
