// app/layout.tsx
import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata = {
  title: 'Parents LMS',
  description: 'Course platform for your parents\' classes',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground transition-colors">
        <ThemeProvider>
          <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-bold font-serif text-primary">
                Global Indo
              </Link>
              <div className="flex items-center gap-3 text-sm">
                {/* <Link href="/student/courses">Student</Link>
                <Link href="/teacher/courses">Teacher</Link> */}
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
