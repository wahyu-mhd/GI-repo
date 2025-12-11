'use client'

import {useEffect, useMemo, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Progress} from '@/components/ui/progress'
import type {Course, StudentProgress} from '@/lib/mockData'
import {loadMockSession} from '@/lib/sessionMock'

type Enrollment = {id: string; courseId: string; studentId: string}

export default function StudentProgressPage() {
  const t = useTranslations('student.progress')
  const [studentId, setStudentId] = useState('user-student-1')
  const [progress, setProgress] = useState<StudentProgress[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (value: string | undefined) => {
    if (!value) return t('unknown')
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? t('unknown') : date.toLocaleDateString()
  }

  useEffect(() => {
    const session = loadMockSession()
    if (session?.id) setStudentId(session.id)
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [progressRes, coursesRes, enrollRes] = await Promise.all([
          fetch(`/api/progress?studentId=${studentId}`, {cache: 'no-store'}),
          fetch('/api/courses', {cache: 'no-store'}),
          fetch('/api/superuser/enrollments', {cache: 'no-store'})
        ])
        if (![progressRes, coursesRes, enrollRes].every(r => r.ok)) {
          throw new Error('Failed to load progress data')
        }
        setProgress(await progressRes.json())
        setCourses(await coursesRes.json())
        setEnrollments(await enrollRes.json())
      } catch (err) {
        console.error(err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    if (studentId) load()
  }, [studentId, t])

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c] as const)), [courses])

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
        totalLessons: 0
      }))
    return [...inProgress, ...missing]
  }, [courses, enrolledCourseIds, progress, studentId])

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">{t('loading')}</p>}

      {!loading && visibleProgress.length === 0 && (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      )}

      <div className="space-y-3">
        {visibleProgress.map(item => {
          const course = courseMap.get(item.courseId)
          const total = item.totalLessons || 0
          const completed = Math.min(item.completedLessons || 0, total || Infinity)
          const pct =
            item.percentComplete ?? (total > 0 ? Math.round((completed / total) * 100) : 0)
          return (
            <div key={item.id} className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{course?.title ?? item.courseId}</p>
                  <p className="text-xs text-slate-500">
                    {t('lessons', {completed, total: total || t('unknown')})}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-700">{pct}%</div>
              </div>
              <Progress value={pct} />
              <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                <span>{t('started', {date: formatDate(item.startedAt)})}</span>
                <span>{t('updated', {date: formatDate(item.updatedAt)})}</span>
                {item.lastLessonId && <span>{t('lastLesson', {id: item.lastLessonId})}</span>}
                {item.lastQuizId && <span>{t('lastQuiz', {id: item.lastQuizId})}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
