'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { Quiz } from '@/lib/mockData'
import { DeleteQuizButton } from '@/components/teacher/DeleteQuizButton'

type Props = {
  courseId: string
  quizzes: Quiz[]
}

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

export function TeacherQuizList({ courseId, quizzes }: Props) {
  const t = useTranslations('teacher.courseDetail.quizzesPage')
  const [searchTerm, setSearchTerm] = useState('')
  const normalizedQuery = searchTerm.trim().toLowerCase()
  const filteredQuizzes = useMemo(() => {
    if (!normalizedQuery) return quizzes
    return quizzes.filter(quiz => {
      const searchableText = [quiz.title, quiz.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchableText.includes(normalizedQuery)
    })
  }, [normalizedQuery, quizzes])

  if (quizzes.length === 0) {
    return <p className="text-sm text-slate-500">{t('empty')}</p>
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-white p-3">
        <label htmlFor="quiz-search" className="sr-only">
          {t('searchPlaceholder')}
        </label>
        <input
          id="quiz-search"
          type="search"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {filteredQuizzes.length === 0 && (
        <p className="text-sm text-slate-500">{t('noResults')}</p>
      )}

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {filteredQuizzes.map(q => (
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
                  {' - '}
                  {formatDate(q.availableUntil)
                    ? t('closes', { time: formatDate(q.availableUntil) })
                    : t('noClose')}
                </p>
              )}
            </div>
            <div className="flex gap-3 text-xs items-center">
              <Link
                href={`/teacher/courses/${courseId}/quizzes/${q.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                {t('edit')}
              </Link>
              <Link
                href={`/teacher/courses/${courseId}/quizzes/${q.id}/print`}
                className="text-blue-600 hover:underline"
              >
                {t('print')}
              </Link>
              <Link
                href={`/teacher/courses/${courseId}/quizzes/${q.id}/submissions`}
                className="text-blue-600 hover:underline"
              >
                {t('submissions')}
              </Link>
              <DeleteQuizButton quizId={q.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
