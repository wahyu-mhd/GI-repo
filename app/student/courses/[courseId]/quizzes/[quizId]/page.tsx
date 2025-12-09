'use client'

import { use, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Course, Quiz, QuizQuestion, QuizSubmission } from '@/lib/mockData'
import { LessonContent } from '@/components/lesson/LessonContent'

type Params = { courseId: string; quizId: string } | Promise<{ courseId: string; quizId: string }>
type Props = { params: Params }

function unwrapParams(params: Params) {
  if (params && typeof (params as any).then === 'function') {
    return use(params as Promise<{ courseId: string; quizId: string }>)
  }
  return params as { courseId: string; quizId: string }
}

export default function QuizPage({ params }: Props) {
  const { courseId, quizId } = unwrapParams(params)
  const studentId = 'user-student-1'
  const [course, setCourse] = useState<Course | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submission, setSubmission] = useState<QuizSubmission | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [courseRes, quizRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, { cache: 'no-store' }),
          fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' }),
        ])
        if (courseRes.status === 404 || quizRes.status === 404) {
          setError('Quiz not found.')
          return
        }
        if (!courseRes.ok || !quizRes.ok) throw new Error('Failed to load quiz')
        const courseData = (await courseRes.json()) as Course
        const quizData = await quizRes.json()
        setCourse(courseData)
        setQuiz(quizData.quiz ?? quizData)
        const qs: QuizQuestion[] = (quizData.questions ?? []).map((q: QuizQuestion) => ({
          ...q,
          correctPoints: q.correctPoints ?? 1,
          wrongPoints: q.wrongPoints ?? 0,
          skipPoints: q.skipPoints ?? 0,
        }))
        setQuestions(qs)
        setAnswers(qs.map(() => null))
      } catch (err) {
        console.error(err)
        setError('Could not load quiz.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, quizId])

  if (loading) {
    return <p className="text-sm text-slate-500">Loading quiz...</p>
  }

  if (error || !course || !quiz) return notFound()

  const handleSelect = (qIndex: number, choiceIndex: number) => {
    if (submitted) return
    setAnswers(prev => prev.map((a, i) => (i === qIndex ? choiceIndex : a)))
  }

  const handleSubmit = () => {
    if (submitted || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    fetch(`/api/students/${studentId}/quizzes/${quizId}/submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, courseId }),
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
        const message = err instanceof Error ? err.message : 'Could not submit quiz.'
        setSubmitError(message)
        if (typeof window !== 'undefined' && message.toLowerCase().includes('attempt limit')) {
          window.alert(message)
        }
      })
      .finally(() => setSubmitting(false))
  }

  const scoreSummary = submission
    ? { earned: submission.earned, possible: submission.possible }
    : null

  return (
    <section className="space-y-4">
      <div>
        <Link
          href={`/student/courses/${course.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-sm text-slate-700 mt-1">{quiz.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          if (!q.choices) return null

          return (
            <div
              key={q.id}
              className="rounded-lg border bg-white p-4 space-y-2"
            >
              <p className="font-medium text-sm">
                {qIndex + 1}. {q.questionText}
              </p>
              <div className="space-y-1">
                {q.choices.map((choice, cIndex) => {
                  const response = submission?.responses.find(r => r.questionId === q.id)
                  const selected = response ? response.selectedIndex : answers[qIndex]
                  const isSelected = selected === cIndex
                  const isCorrect = submitted && response ? response.isCorrect && cIndex === response.correctIndex : submitted && cIndex === q.correctIndex
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
                        isWrong ? 'bg-red-50 border-red-500' : '',
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
                  <span className="font-semibold text-slate-800 block">Explanation:</span>
                  <LessonContent content={q.explanation} />
                </div>
              )}
            </div>
          )
        })}

        {/* {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="rounded-lg border bg-white p-4 space-y-2"
          >
            <p className="font-medium text-sm">
              {qIndex + 1}. {q.questionText}
            </p>
            <div className="space-y-1">
              {q.choices.map((choice, cIndex) => {
                const isSelected = answers[qIndex] === cIndex
                const isCorrect = submitted && cIndex === q.correctIndex
                const isWrong =submitted && isSelected && cIndex !== q.correctIndex

                return (
                  <button
                    key={cIndex}
                    type="button"
                    onClick={() => handleSelect(qIndex, cIndex)}
                    className={[
                      'block w-full text-left rounded border px-3 py-2 text-sm',
                      isSelected ? 'border-blue-500' : 'border-slate-200',
                      isCorrect ? 'bg-green-50 border-green-500' : '',
                      isWrong ? 'bg-red-50 border-red-500' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
          </div>
        ))} */}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      ) : (
        <p className="text-sm font-semibold">
          Your score: {scoreSummary?.earned ?? 0} / {scoreSummary?.possible ?? 0}
        </p>
      )}
      {submitError && <p className="text-xs text-red-600">{submitError}</p>}
    </section>
  )
}
