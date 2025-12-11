'use client'

import {use, useEffect, useMemo, useRef, useState} from 'react'
import {notFound} from 'next/navigation'
import {useTranslations} from 'next-intl'
import {Link} from '@/navigation'
import type {Course, Quiz, QuizQuestion, QuizSubmission} from '@/lib/mockData'
import {LessonContent} from '@/components/lesson/LessonContent'

type Params = {courseId: string; quizId: string} | Promise<{courseId: string; quizId: string}>
type Props = {params: Params}

function unwrapParams(params: Params) {
  if (params && typeof (params as any).then === 'function') {
    return use(params as Promise<{courseId: string; quizId: string}>)
  }
  return params as {courseId: string; quizId: string}
}

export default function QuizPage({params}: Props) {
  const {courseId, quizId} = unwrapParams(params)
  const t = useTranslations('student.quiz')
  const studentId = 'user-student-1'
  const [course, setCourse] = useState<Course | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessMessage, setAccessMessage] = useState<string | null>(null)

  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submission, setSubmission] = useState<QuizSubmission | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null)
  const autoSubmitRef = useRef(false)

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDateTime = (value?: string | number) => {
    if (!value) return ''
    const date = typeof value === 'number' ? new Date(value) : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [courseRes, quizRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, {cache: 'no-store'}),
          fetch(`/api/quizzes/${quizId}`, {cache: 'no-store'})
        ])
        if (courseRes.status === 404 || quizRes.status === 404) {
          setError(t('notFound'))
          return
        }
        if (!courseRes.ok || !quizRes.ok) throw new Error('Failed to load quiz')
        const courseData = (await courseRes.json()) as Course
        const quizData = await quizRes.json()
        setCourse(courseData)
        const loadedQuiz = quizData.quiz ?? quizData
        const now = Date.now()
        const opensAt = loadedQuiz.availableFrom
          ? new Date(loadedQuiz.availableFrom).getTime()
          : undefined
        const closesAt = loadedQuiz.availableUntil
          ? new Date(loadedQuiz.availableUntil).getTime()
          : undefined
        let blocked: string | null = null
        if ((opensAt && Number.isNaN(opensAt)) || (closesAt && Number.isNaN(closesAt))) {
          blocked = t('availabilityInvalid')
        } else if (opensAt && now < opensAt) {
          blocked = t('opensAt', {time: formatDateTime(opensAt)})
        } else if (closesAt && now > closesAt) {
          blocked = t('closed')
        }
        setQuiz(loadedQuiz)
        setAccessMessage(blocked)
        const qs: QuizQuestion[] = (quizData.questions ?? []).map((q: QuizQuestion) => ({
          ...q,
          correctPoints: q.correctPoints ?? 1,
          wrongPoints: q.wrongPoints ?? 0,
          skipPoints: q.skipPoints ?? 0
        }))
        setQuestions(qs)
        setAnswers(qs.map(() => null))
        setTimeLeftSeconds(
          loadedQuiz.timeLimitMinutes && !blocked
            ? Math.max(loadedQuiz.timeLimitMinutes * 60, 0)
            : null
        )
      } catch (err) {
        console.error(err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, quizId, t])

  useEffect(() => {
    if (!quiz?.timeLimitMinutes) return
    if (submitted || submitting) return
    if (timeLeftSeconds === null) return
    if (accessMessage) return
    if (timeLeftSeconds <= 0) {
      if (!autoSubmitRef.current) {
        autoSubmitRef.current = true
        handleSubmit()
      }
      return
    }
    const timerId = window.setInterval(() => {
      setTimeLeftSeconds(prev => (prev === null ? prev : Math.max(prev - 1, 0)))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [quiz?.timeLimitMinutes, submitted, submitting, timeLeftSeconds, accessMessage])

  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>
  }

  if (error === t('notFound') || !course || !quiz) return notFound()
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (accessMessage) {
    return (
      <section className="space-y-3">
        <Link
          href={`/student/courses/${courseId}`}
          className="text-xs text-blue-600 hover:underline"
        >
          {t('back')}
        </Link>
        <div className="rounded border bg-white p-4 space-y-2">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-slate-700">{accessMessage}</p>
          <p className="text-xs text-slate-500">
            {quiz.availableFrom ? `${t('opensLabel')} ${formatDateTime(quiz.availableFrom)}` : t('opensAnytime')}
            {' • '}
            {quiz.availableUntil ? `${t('closesLabel')} ${formatDateTime(quiz.availableUntil)}` : t('closesNoLimit')}
          </p>
        </div>
      </section>
    )
  }

  const handleSelect = (qIndex: number, choiceIndex: number) => {
    if (submitted || submitting) return
    if (accessMessage) return
    setAnswers(prev => prev.map((a, i) => (i === qIndex ? choiceIndex : a)))
  }

  const handleSubmit = () => {
    if (submitted || submitting) return
    if (accessMessage) {
      setSubmitError(accessMessage)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    fetch(`/api/students/${studentId}/quizzes/${quizId}/submission`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({answers, courseId})
    })
      .then(async res => {
        if (!res.ok) {
          const detail = await res.json().catch(() => null)
          throw new Error(detail?.error || 'Failed to submit quiz')
        }
        return res.json()
      })
      .then((saved: QuizSubmission) => {
        setSubmission(saved)
        setSubmitted(true)
      })
      .catch(err => {
        console.error(err)
        const message = err instanceof Error ? err.message : t('submitError')
        setSubmitError(message)
        if (typeof window !== 'undefined' && message.toLowerCase().includes('attempt limit')) {
          window.alert(message)
        }
      })
      .finally(() => setSubmitting(false))
  }

  const scoreSummary = submission
    ? {earned: submission.earned, possible: submission.possible}
    : null

  return (
    <section className="space-y-4">
      {quiz.timeLimitMinutes && (
        <div className="sticky top-0 z-20 -mx-2 md:mx-0 border-b bg-white/90 backdrop-blur px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-600 tracking-wide">
            {t('timeRemaining')}
          </span>
          <span className="text-2xl font-bold text-red-600">
            {submitted ? t('finished') : formatTime(timeLeftSeconds)}
          </span>
        </div>
      )}
      <div>
        <Link
          href={`/student/courses/${course.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          {t('back')}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && <p className="text-sm text-slate-700 mt-1">{quiz.description}</p>}
        {(quiz.availableFrom || quiz.availableUntil) && (
          <p className="text-xs text-slate-500 mt-1">
            {quiz.availableFrom ? `${t('opensLabel')} ${formatDateTime(quiz.availableFrom)}` : t('opensAnytime')}
            {' • '}
            {quiz.availableUntil ? `${t('closesLabel')} ${formatDateTime(quiz.availableUntil)}` : t('closesNoLimit')}
          </p>
        )}
        {quiz.timeLimitMinutes && (
          <p className="text-xs text-slate-500 mt-1">
            {t('timeLimit', {count: quiz.timeLimitMinutes})}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          if (!q.choices) return null

          return (
            <div key={q.id} className="rounded-lg border bg-white p-4 space-y-2">
              <p className="font-medium text-sm">
                {qIndex + 1}. {q.questionText}
              </p>
              <div className="space-y-1">
                {q.choices.map((choice, cIndex) => {
                  const response = submission?.responses.find(r => r.questionId === q.id)
                  const selected = response ? response.selectedIndex : answers[qIndex]
                  const isSelected = selected === cIndex
                  const isCorrect =
                    submitted && response
                      ? response.isCorrect && cIndex === response.correctIndex
                      : submitted && cIndex === q.correctIndex
                  const isWrong =
                    submitted && response
                      ? !response.isCorrect && isSelected
                      : submitted && isSelected && cIndex !== q.correctIndex

                  return (
                    <button
                      key={cIndex}
                      type="button"
                      onClick={() => handleSelect(qIndex, cIndex)}
                      className={[
                        'block w-full text-left rounded border px-3 py-2 text-sm',
                        isSelected ? 'border-blue-500' : 'border-slate-200',
                        isCorrect ? 'bg-green-50 border-green-500' : '',
                        isWrong ? 'bg-red-50 border-red-500' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
              {submitted && q.explanation && (
                <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-800 block">{t('explanation')}</span>
                  <LessonContent content={q.explanation} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          disabled={submitting}
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      ) : (
        <p className="text-sm font-semibold">
          {t('score', {earned: scoreSummary?.earned ?? 0, possible: scoreSummary?.possible ?? 0})}
        </p>
      )}
      {submitError && <p className="text-xs text-red-600">{submitError}</p>}
    </section>
  )
}
