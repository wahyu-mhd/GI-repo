'use client'

import { use, useEffect, useMemo, useState } from 'react'
import type { Course, StudentProgress } from '@/lib/mockData'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

type Enrollment = { id: string; courseId: string; studentId: string }

function formatDate(value: string | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export default function TeacherStudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = use(params)
  const [progress, setProgress] = useState<StudentProgress[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [progressRes, coursesRes, enrollRes] = await Promise.all([
          fetch(`/api/progress?studentId=${studentId}`, { cache: 'no-store' }),
          fetch('/api/courses', { cache: 'no-store' }),
          fetch('/api/superuser/enrollments', { cache: 'no-store' }),
        ])
        if (![progressRes, coursesRes, enrollRes].every(r => r.ok)) {
          throw new Error('Failed to load progress data')
        }
        setProgress(await progressRes.json())
        setCourses(await coursesRes.json())
        setEnrollments(await enrollRes.json())
      } catch (err) {
        console.error(err)
        setError('Could not load progress.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  const courseMap = useMemo(
    () => new Map(courses.map(c => [c.id, c] as const)),
    [courses]
  )

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.filter(e => e.studentId === studentId).map(e => e.courseId)),
    [enrollments, studentId]
  )

  const visibleProgress = useMemo(() => {
    const inProgress = progress.filter(p => enrolledCourseIds.has(p.courseId))
    const missing = courses
      .filter(c => enrolledCourseIds.has(c.id) && !inProgress.some(p => p.courseId === c.id))
      .map(c => ({
        id: `missing-${c.id}`,
        courseId: c.id,
        studentId,
        startedAt: '',
        updatedAt: '',
        completedLessons: 0,
        totalLessons: 0,
      }))
    return [...inProgress, ...missing]
  }, [courses, enrolledCourseIds, progress, studentId])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Progress</h1>
          <p className="text-sm text-slate-600">Student ID: {studentId}</p>
        </div>
        <Link href="/teacher/courses" className="text-blue-600 text-sm hover:underline">
          Back to courses
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading progress...</p>}
      {!loading && visibleProgress.length === 0 && (
        <p className="text-sm text-slate-500">No progress to show yet.</p>
      )}

      <div className="space-y-3">
        {visibleProgress.map(item => {
          const course = courseMap.get(item.courseId)
          const total = item.totalLessons || 0
          const completed = Math.min(item.completedLessons || 0, total || Infinity)
          const pct =
            item.percentComplete ??
            (total > 0 ? Math.round((completed / total) * 100) : 0)
          return (
            <div
              key={item.id}
              className="rounded-lg border bg-white p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{course?.title ?? item.courseId}</p>
                  <p className="text-xs text-slate-500">
                    Lessons: {completed}/{total || '—'}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-700">{pct}%</div>
              </div>
              <Progress value={pct} />
              <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                <span>Started: {formatDate(item.startedAt)}</span>
                <span>Updated: {formatDate(item.updatedAt)}</span>
                {item.lastLessonId && <span>Last lesson: {item.lastLessonId}</span>}
                {item.lastQuizId && (
                  <Link
                    href={`/teacher/students/${studentId}/quizzes/${item.lastQuizId}`}
                    className="text-blue-600 hover:underline"
                  >
                    Last quiz: {item.lastQuizId}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
