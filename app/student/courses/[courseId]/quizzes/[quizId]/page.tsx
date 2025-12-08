'use client'

import { use, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Course, Quiz } from '@/lib/mockData'

type Params = { courseId: string; quizId: string } | Promise<{ courseId: string; quizId: string }>
type Props = { params: Params }

type QuizQuestion = {
  id: string
  quizId: string
  questionText: string
  type: 'single' | 'multiple' | 'short' | 'long'
  choices?: string[]
  correctIndex?: number
  correctPoints?: number
  wrongPoints?: number
  skipPoints?: number
}

function unwrapParams(params: Params) {
  if (params && typeof (params as any).then === 'function') {
    return use(params as Promise<{ courseId: string; quizId: string }>)
  }
  return params as { courseId: string; quizId: string }
}

export default function QuizPage({ params }: Props) {
  const { courseId, quizId } = unwrapParams(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)

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
    setSubmitted(true)
  }

  const scoreSummary = submitted
    ? questions.reduce(
        (acc, q, idx) => {
          const answered = answers[idx]
          const correctPoints = q.correctPoints ?? 1
          const wrongPoints = q.wrongPoints ?? 0
          const skipPoints = q.skipPoints ?? 0
          const possible = acc.possible + correctPoints
          if (answered === null || answered === undefined) {
            return { earned: acc.earned + skipPoints, possible }
          }
          const isCorrect = answered === q.correctIndex
          return {
            earned: acc.earned + (isCorrect ? correctPoints : wrongPoints),
            possible,
          }
        },
        { earned: 0, possible: 0 }
      )
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
                  const isSelected = answers[qIndex] === cIndex
                  const isCorrect = submitted && cIndex === q.correctIndex
                  const isWrong = submitted && isSelected && cIndex !== q.correctIndex

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
        >
          Submit Quiz
        </button>
      ) : (
        <p className="text-sm font-semibold">
          Your score: {scoreSummary?.earned ?? 0} / {scoreSummary?.possible ?? 0}
        </p>
      )}
    </section>
  )
}
