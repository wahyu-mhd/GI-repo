// 'use client'

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/navigation'
import { getQuizzesByCourseFile } from '@/lib/quizFileStore'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import { DeleteQuizButton } from '@/components/teacher/DeleteQuizButton'

export const dynamic = 'force-dynamic'

export default async function TeacherQuizzesPage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const t = await getTranslations('teacher.courseDetail.quizzesPage')
  const course = await getCourseByIdFile(courseId)
  if (!course) return notFound()
  const quizzes = await getQuizzesByCourseFile(course.id)
  const formatDate = (iso?: string) => {
    if (!iso) return null
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  return (
    <section className="space y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('title', { course: course.title })}
          </h1>
          <p className="text-sm text-slate-600">{t('subtitle')}</p>
        </div>
        <Link
          href={`/teacher/courses/${course.id}/quizzes/new`}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('create')}
        </Link>
      </header>

      {quizzes.length === 0 && (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      )}
      <div className="space-y-3">
        {quizzes.map(q => (
          <div
            key={q.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
          >
            <div>
              <h2 className="font-semibold text-sm">{q.title}</h2>
              {q.description && (
                <p className="text-xs text-slate-600 mt-1">{q.description}</p>
              )}
              {q.timeLimitMinutes !== undefined && (
                <p className="text-xs text-slate-500 mt-1">
                  {t('timeLimit', { minutes: q.timeLimitMinutes })}
                </p>
              )}
              {q.maxAttempts !== undefined && (
                <p className="text-xs text-slate-500 mt-1">
                  {t('maxAttempts', { count: q.maxAttempts })}
                </p>
              )}
              {(formatDate(q.availableFrom) || formatDate(q.availableUntil)) && (
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(q.availableFrom)
                    ? t('opens', { time: formatDate(q.availableFrom) })
                    : t('opensAnytime')}
                  {' · '}
                  {formatDate(q.availableUntil)
                    ? t('closes', { time: formatDate(q.availableUntil) })
                    : t('noClose')}
                </p>
              )}
            </div>
            <div className="flex gap-3 text-xs items-center">
              <Link
                href={`/teacher/courses/${course.id}/quizzes/${q.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                {t('edit')}
              </Link>
              <Link
                href={`/teacher/courses/${course.id}/quizzes/${q.id}/print`}
                className="text-blue-600 hover:underline"
              >
                {t('print')}
              </Link>
              <Link
                href={`/teacher/courses/${course.id}/quizzes/${q.id}/submissions`}
                className="text-blue-600 hover:underline"
              >
                {t('submissions')}
              </Link>
              <DeleteQuizButton quizId={q.id} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
