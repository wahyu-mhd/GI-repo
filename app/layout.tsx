// app/layout.tsx
import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Parents LMS',
  description: 'Course platform for your parents\' classes',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold font-serif text-blue-700">
              Global Indo
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/student/courses">Student</Link>
              <Link href="/teacher/courses">Teacher</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
