'use client'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme, isReady } = useTheme()

  if (!isReady) return null

  const isDark = theme === 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="border-input bg-background text-foreground hover:bg-accent/60"
    >
      {isDark ? <Sun className="transition-transform" /> : <Moon className="transition-transform" />}
    </Button>
  )
}
