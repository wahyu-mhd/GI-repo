// app/student/courses/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { Course } from '@/lib/mockData'
import { loadMockSession } from '@/lib/sessionMock'

type Enrollment = { id: string; courseId: string; studentId: string }

export default function StudentCoursesPage() {
  const t = useTranslations('student.courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string>('Student User')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const session = loadMockSession()
    if (session?.id) setSessionUserId(session.id)
    if (session?.name) setSessionName(session.name)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, enrollRes] = await Promise.all([
          fetch('/api/courses', { cache: 'no-store' }),
          fetch('/api/superuser/enrollments', { cache: 'no-store' }),
        ])
        if (!coursesRes.ok || !enrollRes.ok) throw new Error('Failed to load data')
        setCourses((await coursesRes.json()) as Course[])
        setEnrollments((await enrollRes.json()) as Enrollment[])
      } catch (err) {
        console.error(err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  const studentId = sessionUserId ?? 'user-student-1'
  const enrolledCourseIds = new Set(
    enrollments.filter(e => e.studentId === studentId).map(e => e.courseId)
  )
  const visibleCourses = courses.filter(c => enrolledCourseIds.has(c.id))

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-sm text-slate-600">
        {t('subtitle', { name: sessionName })}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !error && (
        <p className="text-sm text-slate-500">{t('loading')}</p>
      )}

      {!loading && !error && visibleCourses.length === 0 && (
        <p className="text-sm text-slate-500">
          {t('empty')}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visibleCourses.map(course => (
          <Link
            key={course.id}
            href={`/student/courses/${course.id}`}
            className="block rounded-lg border bg-white p-4 shadow-sm hover:shadow-md"
          >
            <h2 className="font-semibold">{course.title}</h2>
            <p className="mt-1 text-sm text-slate-700 line-clamp-2">
              {course.description}
            </p>
            <div className="mt-2 text-xs text-slate-500">
              {t('grade', { grade: course.grade })} | {course.subject} | {t('teacher', { name: course.teacherName })}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
