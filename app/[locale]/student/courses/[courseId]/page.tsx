// app/student/courses/[courseId]/page.tsx
'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { Course, Lesson, Module, Quiz } from '@/lib/mockData'
import { loadMockSession } from '@/lib/sessionMock'
import { CourseAnnouncements } from '@/components/announcements/CourseAnnouncements'
import { CourseQuestions } from '@/components/questions/CourseQuestions'
import { Input } from '@/components/ui/input'

type Props = {
  params: Promise<{ courseId: string }>
}

type Enrollment = { id: string; courseId: string; studentId: string }
type Feedback = {
  id: string
  courseId: string
  studentId: string
  teacherName: string
  message: string
  createdAt: string
  read: boolean
  readAt?: string
}

export default function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = use(params)
  const t = useTranslations('student.course')
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [viewerName, setViewerName] = useState('Student User')
  const [studentId, setStudentId] = useState<string>('user-student-1')
  const [moduleQuery, setModuleQuery] = useState('')
  const [quizQuery, setQuizQuery] = useState('')
  const [feedbackQuery, setFeedbackQuery] = useState('')

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
          setError(t('notFound'))
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
          setError(t('notEnrolled'))
          return
        }
        setCourse(courseData)
        const modulesData = (await modulesRes.json()) as Module[]
        modulesData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setModules(modulesData)
        setLessons((await lessonsRes.json()) as Lesson[])
        setQuizzes((await quizzesRes.json()) as Quiz[])
        setAuthorized(true)

        // Feedback load after authorization
        const feedbackRes = await fetch(
          `/api/feedback?studentId=${studentId}&courseId=${courseId}`,
          { cache: 'no-store' }
        )
        if (feedbackRes.ok) {
          const list = (await feedbackRes.json()) as Feedback[]
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setFeedback(list)
        }
      } catch (err) {
        console.error(err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, studentId, t])

  const twelveHoursMs = 12 * 60 * 60 * 1000
  const visibleFeedback = feedback.filter(item => {
    if (!item.read) return true
    if (!item.readAt) return true
    const elapsed = Date.now() - new Date(item.readAt).getTime()
    return elapsed < twelveHoursMs
  })
  const lessonsByModule = useMemo(() => {
    const map = new Map<string, Lesson[]>()
    lessons.forEach(lesson => {
      const list = map.get(lesson.moduleId) ?? []
      list.push(lesson)
      map.set(lesson.moduleId, list)
    })
    return map
  }, [lessons])
  const normalizedModuleQuery = moduleQuery.trim().toLowerCase()
  const filteredModules = useMemo(() => {
    if (!normalizedModuleQuery) {
      return modules.map(module => ({
        module,
        lessons: lessonsByModule.get(module.id) ?? [],
      }))
    }
    return modules.reduce((acc, module) => {
      const moduleLessons = lessonsByModule.get(module.id) ?? []
      const moduleMatches = module.title.toLowerCase().includes(normalizedModuleQuery)
      const matchingLessons = moduleMatches
        ? moduleLessons
        : moduleLessons.filter(lesson =>
            lesson.title.toLowerCase().includes(normalizedModuleQuery)
          )
      if (moduleMatches || matchingLessons.length > 0) {
        acc.push({ module, lessons: matchingLessons })
      }
      return acc
    }, [] as { module: Module; lessons: Lesson[] }[])
  }, [lessonsByModule, modules, normalizedModuleQuery])
  const normalizedQuizQuery = quizQuery.trim().toLowerCase()
  const filteredQuizzes = useMemo(() => {
    if (!normalizedQuizQuery) return quizzes
    return quizzes.filter(quiz => {
      const haystack = [quiz.title, quiz.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuizQuery)
    })
  }, [normalizedQuizQuery, quizzes])
  const normalizedFeedbackQuery = feedbackQuery.trim().toLowerCase()
  const filteredFeedback = useMemo(() => {
    if (!normalizedFeedbackQuery) return visibleFeedback
    return visibleFeedback.filter(item => {
      const haystack = [item.teacherName, item.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedFeedbackQuery)
    })
  }, [normalizedFeedbackQuery, visibleFeedback])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      if (!res.ok) return
      const updated = (await res.json()) as Feedback
      setFeedback(prev =>
        prev.map(item => (item.id === id ? updated : item))
      )
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-slate-500">{t('loading')}</p>
      </section>
    )
  }

  if (error || !authorized || !course) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-600">{error ?? t('notAuthorized')}</p>
        <Link href="/student/courses" className="text-blue-600 text-sm hover:underline">
          {t('back')}
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="mt-1 text-sm text-slate-700">{course.description}</p>
        <p className="mt-1 text-xs text-slate-500">{t('teacher', { name: course.teacherName })}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <CourseAnnouncements courseId={course.id} viewerName={viewerName} />
          <CourseQuestions
            courseId={course.id}
            viewerRole="student"
            viewerName={viewerName}
            viewerId={studentId}
          />

          <h2 className="font-semibold">{t('modulesHeading')}</h2>
          {modules.length > 0 && (
            <div className="max-w-md">
              <Input
                value={moduleQuery}
                onChange={event => setModuleQuery(event.target.value)}
                placeholder={t('modulesSearchPlaceholder')}
                aria-label={t('modulesSearchPlaceholder')}
              />
            </div>
          )}

          {modules.length === 0 && (
            <p className="text-sm text-slate-500">{t('noModules')}</p>
          )}

          {modules.length > 0 && normalizedModuleQuery && filteredModules.length === 0 && (
            <p className="text-sm text-slate-500">{t('modulesNoResults')}</p>
          )}

          {filteredModules.length > 0 && (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {filteredModules.map(({ module, lessons }) => (
                <div key={module.id} className="rounded-lg border bg-white p-3">
                  <h3 className="font-medium">{module.title}</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {lessons.map(lesson => (
                      <li key={lesson.id}>
                        <Link
                          href={`/student/courses/${course.id}/lessons/${lesson.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    ))}
                    {lessons.length === 0 && (
                      <li className="text-xs text-slate-400">{t('noLessons')}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">{t('feedbackHeading')}</h2>
          {visibleFeedback.length > 0 && (
            <div className="max-w-md">
              <Input
                value={feedbackQuery}
                onChange={event => setFeedbackQuery(event.target.value)}
                placeholder={t('feedbackSearchPlaceholder')}
                aria-label={t('feedbackSearchPlaceholder')}
              />
            </div>
          )}

          {visibleFeedback.length === 0 && (
            <p className="text-xs text-slate-400">{t('noFeedback')}</p>
          )}

          {visibleFeedback.length > 0 && normalizedFeedbackQuery && filteredFeedback.length === 0 && (
            <p className="text-xs text-slate-400">{t('feedbackNoResults')}</p>
          )}

          {filteredFeedback.length > 0 && (
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredFeedback.map(item => (
                <div key={item.id} className="rounded-lg border bg-white p-3 text-sm">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{t('feedbackFrom', { name: item.teacherName })}</span>
                    <span>{new Date(item.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}</span>
                  </div>
                  <p className="mt-1 text-slate-800">{item.message}</p>
                  {!item.read && (
                    <div className="mt-2 flex justify-end">
                      <button
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        onClick={() => markAsRead(item.id)}
                      >
                        {t('markRead')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <h2 className="font-semibold">{t('quizzesHeading')}</h2>
          {quizzes.length > 0 && (
            <div className="max-w-md">
              <Input
                value={quizQuery}
                onChange={event => setQuizQuery(event.target.value)}
                placeholder={t('quizzesSearchPlaceholder')}
                aria-label={t('quizzesSearchPlaceholder')}
              />
            </div>
          )}

          {quizzes.length === 0 && (
            <p className="text-xs text-slate-400">{t('noQuizzes')}</p>
          )}

          {quizzes.length > 0 && normalizedQuizQuery && filteredQuizzes.length === 0 && (
            <p className="text-xs text-slate-400">{t('quizzesNoResults')}</p>
          )}

          {filteredQuizzes.length > 0 && (
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredQuizzes.map(quiz => (
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
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
