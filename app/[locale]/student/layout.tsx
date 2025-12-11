// app/student/layout.tsx
'use client'
import type { ReactNode } from 'react'
import {Link} from '@/navigation'
import { usePathname } from 'next/navigation'

function StudentNavLink({
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
        'block rounded px-3 py-2 text-sm',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

// mark as client because we’re using usePathname

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[220px,1fr]">
      {/* Sidebar */}
      <aside className="h-fit rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Student Dashboard
        </h2>
        <nav className="space-y-1">
          <StudentNavLink href="/student/courses" label="My Courses" />
          <StudentNavLink href="/student/progress" label="Progress" />
          {/* <StudentNavLink href="/student/profile" label="Profile" /> */}
        </nav>
      </aside>

      {/* Main content */}
      <section>{children}</section>
    </div>
  )
}
