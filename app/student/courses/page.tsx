// app/student/courses/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Stage, Grade, Course } from '@/lib/mockData'

export default function StudentCoursesPage() {
  const currentStage: Stage = 'junior'
  const currentGrade: Grade = 8
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/courses', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load courses')
        const data = (await res.json()) as Course[]
        setCourses(data)
      } catch (err) {
        console.error(err)
        setError('Could not load courses.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visibleCourses = courses.filter(
    c => c.stage === currentStage && c.grade === currentGrade
  )

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">My Courses</h1>
      <p className="text-sm text-slate-600">
        Showing courses for Grade {currentGrade} ({currentStage} school).
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !error && (
        <p className="text-sm text-slate-500">Loading courses...</p>
      )}

      {!loading && !error && visibleCourses.length === 0 && (
        <p className="text-sm text-slate-500">No courses for your grade yet.</p>
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
              Grade {course.grade} | {course.subject} | Teacher: {course.teacherName}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
