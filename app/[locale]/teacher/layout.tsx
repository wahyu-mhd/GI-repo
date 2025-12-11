// app/teacher/layout.tsx
'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Link } from '@/navigation'

function TeacherNavLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={[
        'block rounded px-3 py-2 text-sm font-medium transition',
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100'
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[220px,1fr]">
      {/* Sidebar */}
      <aside className="h-fit rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Teacher Dashboard
        </h2>

        <nav className="space-y-1">
          <TeacherNavLink href="/teacher/courses" label="My Courses" />

          {/* Future features (just placeholders for now) */}
          {/* <TeacherNavLink href="/teacher/materials" label="Materials" /> */}
          {/* <TeacherNavLink href="/teacher/quizzes" label="Quizzes" /> */}
          {/* <TeacherNavLink href="/teacher/students" label="Students" /> */}
        </nav>
      </aside>

      {/* Main page content */}
      <section>{children}</section>
    </div>
  )
}
