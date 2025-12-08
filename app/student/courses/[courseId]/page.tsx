// app/student/courses/[courseId]/page.tsx
'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Course, Lesson, Module, Quiz } from '@/lib/mockData'
import { loadMockSession } from '@/lib/sessionMock'
import { CourseAnnouncements } from '@/components/announcements/CourseAnnouncements'

type Props = {
  params: Promise<{ courseId: string }>
}

type Enrollment = { id: string; courseId: string; studentId: string }

export default function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [viewerName, setViewerName] = useState('Student User')
  const [studentId, setStudentId] = useState<string>('user-student-1')

  useEffect(() => {
    const session = loadMockSession()
    if (session?.id) setStudentId(session.id)
    if (session?.name) setViewerName(session.name)
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [courseRes, enrollRes, modulesRes, lessonsRes, quizzesRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, { cache: 'no-store' }),
          fetch('/api/superuser/enrollments', { cache: 'no-store' }),
          fetch(`/api/courses/${courseId}/modules`, { cache: 'no-store' }),
          fetch(`/api/courses/${courseId}/lessons`, { cache: 'no-store' }),
          fetch(`/api/courses/${courseId}/quizzes`, { cache: 'no-store' }),
        ])
        if (courseRes.status === 404) {
          setError('Course not found.')
          return
        }
        if (![courseRes, enrollRes, modulesRes, lessonsRes, quizzesRes].every(r => r.ok)) {
          throw new Error('Failed to load course data')
        }
        const courseData = (await courseRes.json()) as Course
        const enrollments = (await enrollRes.json()) as Enrollment[]
        const isEnrolled = enrollments.some(
          e => e.courseId === courseData.id && e.studentId === studentId
        )
        if (!isEnrolled) {
          setError('You are not enrolled in this course.')
          return
        }
        setCourse(courseData)
        const modulesData = (await modulesRes.json()) as Module[]
        modulesData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setModules(modulesData)
        setLessons((await lessonsRes.json()) as Lesson[])
        setQuizzes((await quizzesRes.json()) as Quiz[])
        setAuthorized(true)
      } catch (err) {
        console.error(err)
        setError('Could not load course.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, studentId])

  if (loading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-slate-500">Loading course...</p>
      </section>
    )
  }

  if (error || !authorized || !course) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-600">{error ?? 'Not authorized for this course.'}</p>
        <Link href="/student/courses" className="text-blue-600 text-sm hover:underline">
          Back to my courses
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="mt-1 text-sm text-slate-700">{course.description}</p>
        <p className="mt-1 text-xs text-slate-500">Teacher: {course.teacherName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <CourseAnnouncements courseId={course.id} viewerName={viewerName} />

          <h2 className="font-semibold">Modules & Lessons</h2>
          {modules.map(module => {
            const moduleLessons = lessons.filter(l => l.moduleId === module.id)
            return (
              <div key={module.id} className="rounded-lg border bg-white p-3">
                <h3 className="font-medium">{module.title}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {moduleLessons.map(lesson => (
                    <li key={lesson.id}>
                      <Link
                        href={`/student/courses/${course.id}/lessons/${lesson.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                  {moduleLessons.length === 0 && (
                    <li className="text-xs text-slate-400">No lessons yet.</li>
                  )}
                </ul>
              </div>
            )
          })}
          {modules.length === 0 && (
            <p className="text-sm text-slate-500">No modules yet.</p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Quizzes</h2>
          <div className="space-y-2">
            {quizzes.map(quiz => (
              <Link
                key={quiz.id}
                href={`/student/courses/${course.id}/quizzes/${quiz.id}`}
                className="block rounded-lg border bg-white p-3 text-sm hover:shadow-sm"
              >
                <div className="font-medium">{quiz.title}</div>
                {quiz.description && (
                  <p className="text-xs text-slate-600 mt-1">
                    {quiz.description}
                  </p>
                )}
              </Link>
            ))}
            {quizzes.length === 0 && (
              <p className="text-xs text-slate-400">No quizzes yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
