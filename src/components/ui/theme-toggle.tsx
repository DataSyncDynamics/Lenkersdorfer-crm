"use client"

import * as React from "react"
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"
import { useTheme } from "./theme-provider"
import { Button } from "./button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-gold-400 transition-all duration-200"
    >
      <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}