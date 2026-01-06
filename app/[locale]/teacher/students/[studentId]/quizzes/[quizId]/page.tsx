'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Course, Quiz, QuizQuestion, QuizSubmission } from '@/lib/mockData'
import { LessonContent } from '@/components/lesson/LessonContent'
import { Checkbox } from '@/components/ui/checkbox'

export default function TeacherStudentQuizPage({
  params,
}: {
  params: Promise<{ studentId: string; quizId: string }>
}) {
  const { studentId, quizId } = use(params)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [submission, setSubmission] = useState<QuizSubmission | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [quizRes, submissionRes] = await Promise.all([
          fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' }),
          fetch(`/api/students/${studentId}/quizzes/${quizId}/submission`, { cache: 'no-store' }),
        ])

        if (quizRes.status === 404 || submissionRes.status === 404) {
          setError('Not found')
          return
        }
        if (!quizRes.ok || !submissionRes.ok) throw new Error('Failed to load')

        const quizData = await quizRes.json()
        const submissionData = (await submissionRes.json()) as QuizSubmission
        setQuiz(quizData.quiz ?? quizData)
        setQuestions(quizData.questions ?? [])
        setSubmission(submissionData)

        const courseId = quizData.quiz?.courseId ?? quizData.courseId ?? submissionData.courseId
        if (courseId) {
          const courseRes = await fetch(`/api/courses/${courseId}`, { cache: 'no-store' })
          if (courseRes.ok) {
            setCourse((await courseRes.json()) as Course)
          }
        }
      } catch (err) {
        console.error(err)
        setError('Could not load submission.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId, studentId])

  const responseMap = useMemo(
    () => new Map(submission?.responses.map(r => [r.questionId, r]) ?? []),
    [submission]
  )

  if (loading) {
    return <p className="text-sm text-slate-500">Loading submission...</p>
  }

  if (error === 'Not found' || !quiz || !submission) return notFound()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Quiz submission</p>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-slate-600">
            Student: {studentId} {course ? `• Course: ${course.title}` : ''}
          </p>
        </div>
        <Link
          href={`/teacher/students/${studentId}/progress`}
          className="text-blue-600 text-sm hover:underline"
        >
          Back to student
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">
          Score: {submission.earned} / {submission.possible}
        </p>
        <p className="text-xs text-slate-500">Submitted at: {submission.submittedAt}</p>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <Checkbox
            checked={showCorrectAnswers}
            onCheckedChange={checked => setShowCorrectAnswers(checked === true)}
            aria-label="Show correct answers"
          />
          Show correct answers
        </label>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const response = responseMap.get(q.id)
          const selectedLabel =
            response?.selectedIndex !== null &&
            response?.selectedIndex !== undefined &&
            response?.selectedIndex >= 0
              ? q.choices?.[response.selectedIndex] ?? `Choice ${response.selectedIndex + 1}`
              : response?.answerText || (response ? 'Skipped' : 'No response')
          const correctLabel =
            q.correctIndex !== undefined && q.correctIndex !== null
              ? q.choices?.[q.correctIndex] ?? `Choice ${q.correctIndex + 1}`
              : q.expectedAnswer || '—'
          const isCorrect = response?.isCorrect
          const statusLabel =
            isCorrect === undefined ? 'No response' : isCorrect ? 'Correct' : 'Incorrect'
          const statusClass =
            isCorrect === undefined ? 'text-slate-600' : isCorrect ? 'text-green-700' : 'text-red-700'

          return (
            <div key={q.id} className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">
                    {idx + 1}. {q.questionText}
                  </p>
                  <p className={`text-xs ${statusClass} font-semibold`}>{statusLabel}</p>
                </div>
                <div className="text-xs text-slate-500">Type: {q.type}</div>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-800">Student answer</p>
                <p className="text-slate-700">{selectedLabel}</p>
              </div>

              {showCorrectAnswers && (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-800">Correct answer</p>
                  <p className="text-slate-700">{correctLabel}</p>
                </div>
              )}

              {q.explanation && (
                <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-800 block">Explanation:</span>
                  <LessonContent content={q.explanation} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
